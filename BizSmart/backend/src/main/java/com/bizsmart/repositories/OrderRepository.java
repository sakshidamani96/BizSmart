package com.bizsmart.repositories;

import com.bizsmart.models.Order;
import com.bizsmart.models.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Order> findByCreatedAtGreaterThanEqualAndStatusNot(LocalDateTime since, OrderStatus status);

    // Enum literals must be fully-qualified in JPQL (comparing to a plain string fails validation)
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status <> com.bizsmart.models.OrderStatus.CANCELLED")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = com.bizsmart.models.OrderStatus.PENDING")
    long countPendingOrders();

    /** Rows of [productId, productName, unitsSold, revenue] for non-cancelled orders. */
    @Query("SELECT oi.product.id, oi.product.name, SUM(oi.quantity), SUM(oi.subtotal) " +
            "FROM OrderItem oi WHERE oi.order.status <> com.bizsmart.models.OrderStatus.CANCELLED " +
            "AND oi.order.createdAt >= :since " +
            "GROUP BY oi.product.id, oi.product.name ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingProductsSince(@Param("since") LocalDateTime since, Pageable pageable);
}
