package com.example.backendspring.product.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByIdAndDeletedAtIsNull(Long id);

    Optional<Product> findByApiIdAndDeletedAtIsNull(String apiId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    // 재고가 음수가 되지 않도록 조건을 건 뒤, 재고 차감을 원자적으로 수행합니다.
    @Query("""
            UPDATE Product p
            SET p.stock = p.stock - :qty
            WHERE p.id = :id
              AND p.deletedAt IS NULL
              AND p.stock >= :qty
            """)
    int decreaseStockIfAvailable(@Param("id") Long id, @Param("qty") int qty);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    // 물리 삭제 대신 삭제 시각을 기록하고, 조회 시에는 삭제된 행을 제외합니다.
    @Query("""
            UPDATE Product p
            SET p.deletedAt = CURRENT_TIMESTAMP
            WHERE p.id = :id
              AND p.deletedAt IS NULL
            """)
    int softDeleteById(@Param("id") Long id);
}
