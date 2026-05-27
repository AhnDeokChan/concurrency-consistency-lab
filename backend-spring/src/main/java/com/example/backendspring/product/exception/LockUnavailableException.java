package com.example.backendspring.product.exception;

public class LockUnavailableException extends RuntimeException {

    public LockUnavailableException(String lockKey) {
        super("락 획득에 실패했습니다: " + lockKey);
    }
}
