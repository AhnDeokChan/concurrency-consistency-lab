package com.example.backendspring.common;

import com.example.backendspring.product.exception.DuplicateApiIdException;
import com.example.backendspring.product.exception.InsufficientStockException;
import com.example.backendspring.product.exception.LockUnavailableException;
import com.example.backendspring.product.exception.ProductNotFoundException;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
// 도메인/애플리케이션 예외를 프론트엔드/테스트에서 다루기 쉬운 고정 API 에러 코드로 매핑합니다.
public class ApiExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ApiError> handleProductNotFound(ProductNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError("PRODUCT_NOT_FOUND", ex.getMessage(), Instant.now()));
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ApiError> handleInsufficientStock(InsufficientStockException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError("INSUFFICIENT_STOCK", ex.getMessage(), Instant.now()));
    }

    @ExceptionHandler(DuplicateApiIdException.class)
    public ResponseEntity<ApiError> handleDuplicateApiId(DuplicateApiIdException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError("DUPLICATE_API_ID", ex.getMessage(), Instant.now()));
    }

    @ExceptionHandler(LockUnavailableException.class)
    public ResponseEntity<ApiError> handleLockUnavailable(LockUnavailableException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError("LOCK_UNAVAILABLE", ex.getMessage(), Instant.now()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError("DATA_INTEGRITY_VIOLATION", "Request conflicts with database constraints.", Instant.now()));
    }

    @ExceptionHandler({IllegalArgumentException.class, ConstraintViolationException.class})
    public ResponseEntity<ApiError> handleBadRequest(Exception ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError("BAD_REQUEST", ex.getMessage(), Instant.now()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getAllErrors().stream()
                .findFirst()
                .map(error -> {
                    if (error instanceof FieldError fieldError) {
                        return fieldError.getField() + ": " + fieldError.getDefaultMessage();
                    }
                    return error.getDefaultMessage();
                })
                .orElse("Invalid request.");

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError("VALIDATION_ERROR", message, Instant.now()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnhandled(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("INTERNAL_ERROR", "Unexpected server error.", Instant.now()));
    }

    public record ApiError(String code, String message, Instant timestamp) {
    }
}
