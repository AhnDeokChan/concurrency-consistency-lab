package com.example.backendspring.common;

import com.example.backendspring.product.exception.DuplicateApiIdException;
import com.example.backendspring.product.exception.InsufficientStockException;
import com.example.backendspring.product.exception.LockUnavailableException;
import com.example.backendspring.product.exception.ProductNotFoundException;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import org.springframework.core.task.TaskRejectedException;
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

    @ExceptionHandler(TaskRejectedException.class)
    public ResponseEntity<ApiError> handleTaskRejected(TaskRejectedException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ApiError("SERVICE_UNAVAILABLE", "서버가 일시적으로 과부하 상태입니다.", Instant.now()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        if (isApiIdUniqueViolation(ex)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiError("DUPLICATE_API_ID", "이미 사용 중인 apiId입니다.", Instant.now()));
        }

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError("DATA_INTEGRITY_VIOLATION", "요청이 데이터베이스 제약조건과 충돌합니다.", Instant.now()));
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
                .orElse("유효하지 않은 요청입니다.");

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError("VALIDATION_ERROR", message, Instant.now()));
    }

    @ExceptionHandler({CompletionException.class, ExecutionException.class})
    public ResponseEntity<ApiError> handleAsyncWrappedException(Exception ex) {
        Throwable cause = ex.getCause();
        if (cause == null) {
            return handleUnhandled(ex);
        }

        if (cause instanceof ProductNotFoundException causeEx) {
            return handleProductNotFound(causeEx);
        }
        if (cause instanceof InsufficientStockException causeEx) {
            return handleInsufficientStock(causeEx);
        }
        if (cause instanceof DuplicateApiIdException causeEx) {
            return handleDuplicateApiId(causeEx);
        }
        if (cause instanceof LockUnavailableException causeEx) {
            return handleLockUnavailable(causeEx);
        }
        if (cause instanceof TaskRejectedException causeEx) {
            return handleTaskRejected(causeEx);
        }
        if (cause instanceof DataIntegrityViolationException causeEx) {
            return handleDataIntegrityViolation(causeEx);
        }
        if (cause instanceof ConstraintViolationException causeEx) {
            return handleBadRequest(causeEx);
        }
        if (cause instanceof IllegalArgumentException causeEx) {
            return handleBadRequest(causeEx);
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("INTERNAL_ERROR", "예기치 않은 서버 오류가 발생했습니다.", Instant.now()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnhandled(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("INTERNAL_ERROR", "예기치 않은 서버 오류가 발생했습니다.", Instant.now()));
    }

    private boolean isApiIdUniqueViolation(DataIntegrityViolationException ex) {
        String message = null;

        if (ex.getMostSpecificCause() != null) {
            message = ex.getMostSpecificCause().getMessage();
        }
        if (message == null) {
            message = ex.getMessage();
        }
        if (message == null) {
            return false;
        }

        String normalized = message.toLowerCase();
        return normalized.contains("uq_products_api_id")
                || normalized.contains("products.api_id");
    }

    public record ApiError(String code, String message, Instant timestamp) {
    }
}
