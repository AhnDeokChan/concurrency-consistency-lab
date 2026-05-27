package com.example.backendspring.product.api;

import com.example.backendspring.product.api.dto.CreateProductRequest;
import com.example.backendspring.product.api.dto.DecreaseStockRequest;
import com.example.backendspring.product.api.dto.DecreaseStockResponse;
import com.example.backendspring.product.api.dto.ProductResponse;
import com.example.backendspring.product.api.dto.ProductStockOptionResponse;
import com.example.backendspring.product.service.ProductAsyncService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
// 요청/응답 검증과 HTTP 매핑만 담당하고, 비즈니스 로직은 서비스 계층에 위임합니다.
public class ProductController {

    private final ProductAsyncService productAsyncService;

    public ProductController(ProductAsyncService productAsyncService) {
        this.productAsyncService = productAsyncService;
    }

    @PostMapping
    public CompletableFuture<ResponseEntity<ProductResponse>> createProduct(@Valid @RequestBody CreateProductRequest request) {
        return productAsyncService.createProduct(request)
                .thenApply(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @GetMapping("/{productId}")
    public CompletableFuture<ProductResponse> getProduct(@PathVariable long productId) {
        return productAsyncService.getProduct(productId);
    }

    @GetMapping("/api-id/{apiId}")
    public CompletableFuture<ProductResponse> getProductByApiId(@PathVariable String apiId) {
        return productAsyncService.getProductByApiId(apiId);
    }

    @GetMapping("/stock-options")
    public CompletableFuture<List<ProductStockOptionResponse>> listProductStockOptions() {
        return productAsyncService.listProductStockOptions();
    }

    @PostMapping("/{productId}/decrease")
    public CompletableFuture<DecreaseStockResponse> decreaseStock(
            @PathVariable long productId,
            @Valid @RequestBody DecreaseStockRequest request) {
        return productAsyncService.decreaseStock(productId, request);
    }

    @DeleteMapping("/{productId}")
    public CompletableFuture<ResponseEntity<Void>> deleteProduct(@PathVariable long productId) {
        return productAsyncService.softDeleteProduct(productId)
                .thenApply(unused -> ResponseEntity.noContent().build());
    }
}
