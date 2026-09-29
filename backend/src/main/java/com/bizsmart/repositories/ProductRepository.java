package com.bizsmart.repositories;

import com.bizsmart.models.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySku(String sku);

    Boolean existsBySku(String sku);

    Boolean existsBySkuIgnoreCase(String sku);

    List<Product> findByCategoryId(Long categoryId);

    List<Product> findAllByOrderByNameAsc();

    // NOTE: JPQL must use the persistent field names (quantity/minStock), not the alias getters
    @Query("SELECT p FROM Product p WHERE p.quantity <= p.minStock ORDER BY p.quantity ASC")
    List<Product> findLowStockProducts();

    @Query("SELECT p FROM Product p WHERE p.expiryDate IS NOT NULL AND p.expiryDate <= :cutoff ORDER BY p.expiryDate ASC")
    List<Product> findExpiringOnOrBefore(@Param("cutoff") LocalDate cutoff);

    List<Product> findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(String name, String sku);

    /** Row lock used while deducting stock so two simultaneous sales cannot oversell. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT COALESCE(SUM(p.quantity * p.purchasePrice), 0) FROM Product p")
    java.math.BigDecimal calculateInventoryValueAtCost();
}
