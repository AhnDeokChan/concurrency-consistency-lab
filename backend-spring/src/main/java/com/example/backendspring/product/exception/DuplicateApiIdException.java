package com.example.backendspring.product.exception;

public class DuplicateApiIdException extends RuntimeException {

    public DuplicateApiIdException(String apiId) {
        super("이미 사용 중인 apiId입니다: " + apiId);
    }
}
