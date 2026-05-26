package com.example.backendspring.product.api;

import com.example.backendspring.product.api.dto.CreateProductRequest;
import com.example.backendspring.product.api.dto.DecreaseStockRequest;
import com.example.backendspring.product.api.dto.DecreaseStockResponse;
import com.example.backendspring.product.api.dto.ProductResponse;
import com.example.backendspring.product.service.ProductService;
import jakarta.validation.Valid;
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

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody CreateProductRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{productId}")
    public ProductResponse getProduct(@PathVariable long productId) {
        return productService.getProduct(productId);
    }

    @GetMapping("/api-id/{apiId}")
    public ProductResponse getProductByApiId(@PathVariable String apiId) {
        return productService.getProductByApiId(apiId);
    }

    @PostMapping("/{productId}/decrease")
    public DecreaseStockResponse decreaseStock(
            @PathVariable long productId,
            @Valid @RequestBody DecreaseStockRequest request) {
        return productService.decreaseStock(productId, request);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable long productId) {
        productService.softDeleteProduct(productId);
        return ResponseEntity.noContent().build();
    }
}
