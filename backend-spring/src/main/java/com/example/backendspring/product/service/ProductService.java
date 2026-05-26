package com.example.backendspring.product.service;

import com.example.backendspring.product.api.dto.CreateProductRequest;
import com.example.backendspring.product.api.dto.DecreaseStockRequest;
import com.example.backendspring.product.api.dto.DecreaseStockResponse;
import com.example.backendspring.product.api.dto.ProductResponse;
import com.example.backendspring.product.domain.Product;
import com.example.backendspring.product.domain.ProductRepository;
import com.example.backendspring.product.exception.DuplicateApiIdException;
import com.example.backendspring.product.exception.InsufficientStockException;
import com.example.backendspring.product.exception.LockUnavailableException;
import com.example.backendspring.product.exception.ProductNotFoundException;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
// Redis 분산 락을 이용해 상품 CRUD와 재고 차감 로직을 처리하는 핵심 서비스입니다.
public class ProductService {

    // 워커 장애 시 락이 빠르게 정리되도록 TTL을 짧게 유지합니다.
    private static final Duration LOCK_TTL = Duration.ofSeconds(3);
    // 순간 트래픽 급증을 흡수하기 위해 짧게 재시도한 뒤 LOCK_UNAVAILABLE로 실패 처리합니다.
    private static final int MAX_LOCK_RETRY = 5;

    private final ProductRepository productRepository;
    private final StringRedisTemplate redisTemplate;
    private final DefaultRedisScript<Long> releaseLockScript;

    @Value("${INSTANCE_ID:spring-unknown}")
    private String instanceId;

    public ProductService(ProductRepository productRepository, StringRedisTemplate redisTemplate) {
        this.productRepository = productRepository;
        this.redisTemplate = redisTemplate;

        this.releaseLockScript = new DefaultRedisScript<>();
        // 토큰이 일치할 때만 락을 해제해, 다른 인스턴스의 락을 지우는 문제를 방지합니다.
        this.releaseLockScript.setScriptText("""
                if redis.call('get', KEYS[1]) == ARGV[1] then
                  return redis.call('del', KEYS[1])
                else
                  return 0
                end
                """);
        this.releaseLockScript.setResultType(Long.class);
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        int initialStock = request.stock() == null ? 0 : request.stock();

        // 외부 연동용 apiId는 요청값을 우선 사용하고, 없으면 서버에서 생성합니다.
        String apiId = normalizeOrGenerateApiId(request.apiId());
        if (productRepository.existsByApiIdAndDeletedAtIsNull(apiId)) {
            throw new DuplicateApiIdException(apiId);
        }

        Product product = new Product();
        product.setApiId(apiId);
        product.setName(request.name().trim());
        product.setStock(initialStock);

        Product saved = productRepository.save(product);
        return ProductResponse.from(saved, instanceId);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProduct(long productId) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        return ProductResponse.from(product, instanceId);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductByApiId(String apiId) {
        Product product = productRepository.findByApiIdAndDeletedAtIsNull(apiId)
                .orElseThrow(() -> new ProductNotFoundException(apiId));
        return ProductResponse.from(product, instanceId);
    }

    @Transactional
    public DecreaseStockResponse decreaseStock(long productId, DecreaseStockRequest request) {
        int qty = request.qty();
        String lockKey = lockKey(productId);
        // 동시 차감을 직렬화하기 위해 상품 단위 락을 먼저 획득합니다.
        String lockToken = acquireLockWithRetry(lockKey);

        try {
            // "stock >= qty" 조건 확인과 차감을 단일 SQL로 원자적으로 수행합니다.
            int updatedRows = productRepository.decreaseStockIfAvailable(productId, qty);
            if (updatedRows == 0) {
                Product activeProduct = productRepository.findByIdAndDeletedAtIsNull(productId)
                        .orElseThrow(() -> new ProductNotFoundException(productId));

                throw new InsufficientStockException(activeProduct.getId(), qty);
            }

            Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                    .orElseThrow(() -> new ProductNotFoundException(productId));

            return DecreaseStockResponse.from(product, qty, instanceId);
        } finally {
            releaseLock(lockKey, lockToken);
        }
    }

    @Transactional
    public void softDeleteProduct(long productId) {
        int deletedRows = productRepository.softDeleteById(productId);
        if (deletedRows == 0) {
            throw new ProductNotFoundException(productId);
        }
    }

    private String normalizeOrGenerateApiId(String apiId) {
        if (apiId == null || apiId.isBlank()) {
            return UUID.randomUUID().toString().replace("-", "");
        }

        String normalized = apiId.trim();
        if (normalized.length() > 50) {
            throw new IllegalArgumentException("apiId must be 50 characters or fewer.");
        }

        return normalized;
    }

    private String lockKey(long productId) {
        return "lock:product:" + productId;
    }

    private String acquireLockWithRetry(String lockKey) {
        String token = UUID.randomUUID().toString();

        for (int attempt = 0; attempt < MAX_LOCK_RETRY; attempt++) {
            // Spring API로 Redis SET NX PX와 동일하게(없을 때만 + 만료시간) 락을 설정합니다.
            Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, token, LOCK_TTL);
            if (Boolean.TRUE.equals(acquired)) {
                return token;
            }

            waitBackoff(attempt);
        }

        throw new LockUnavailableException(lockKey);
    }

    private void waitBackoff(int attempt) {
        long backoffMillis = (attempt + 1L) * 30L;
        try {
            Thread.sleep(backoffMillis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new LockUnavailableException("interrupted");
        }
    }

    private void releaseLock(String lockKey, String token) {
        // 비교 후 삭제(compare-and-delete)를 Lua 스크립트로 원자적으로 처리합니다.
        redisTemplate.execute(releaseLockScript, List.of(lockKey), token);
    }
}
