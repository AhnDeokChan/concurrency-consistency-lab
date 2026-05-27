package com.example.backendspring.product.service;

import com.example.backendspring.product.api.dto.CreateProductRequest;
import com.example.backendspring.product.api.dto.DecreaseStockRequest;
import com.example.backendspring.product.api.dto.DecreaseStockResponse;
import com.example.backendspring.product.api.dto.ProductResponse;
import com.example.backendspring.product.api.dto.ProductStockOptionResponse;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
// 컨트롤러 요청을 비동기 스레드풀에서 실행하기 위한 어댑터 서비스입니다.
public class ProductAsyncService {

    private final ProductService productService;

    public ProductAsyncService(ProductService productService) {
        this.productService = productService;
    }

    @Async("productTaskExecutor")
    public CompletableFuture<ProductResponse> createProduct(CreateProductRequest request) {
        try {
            return CompletableFuture.completedFuture(productService.createProduct(request));
        } catch (Exception ex) {
            return CompletableFuture.failedFuture(ex);
        }
    }

    @Async("productTaskExecutor")
    public CompletableFuture<ProductResponse> getProduct(long productId) {
        try {
            return CompletableFuture.completedFuture(productService.getProduct(productId));
        } catch (Exception ex) {
            return CompletableFuture.failedFuture(ex);
        }
    }

    @Async("productTaskExecutor")
    public CompletableFuture<ProductResponse> getProductByApiId(String apiId) {
        try {
            return CompletableFuture.completedFuture(productService.getProductByApiId(apiId));
        } catch (Exception ex) {
            return CompletableFuture.failedFuture(ex);
        }
    }

    @Async("productTaskExecutor")
    public CompletableFuture<List<ProductStockOptionResponse>> listProductStockOptions() {
        try {
            return CompletableFuture.completedFuture(productService.listProductStockOptions());
        } catch (Exception ex) {
            return CompletableFuture.failedFuture(ex);
        }
    }

    @Async("productTaskExecutor")
    public CompletableFuture<DecreaseStockResponse> decreaseStock(long productId, DecreaseStockRequest request) {
        try {
            return CompletableFuture.completedFuture(productService.decreaseStock(productId, request));
        } catch (Exception ex) {
            return CompletableFuture.failedFuture(ex);
        }
    }

    @Async("productTaskExecutor")
    public CompletableFuture<Void> softDeleteProduct(long productId) {
        try {
            productService.softDeleteProduct(productId);
            return CompletableFuture.completedFuture(null);
        } catch (Exception ex) {
            return CompletableFuture.failedFuture(ex);
        }
    }
}
