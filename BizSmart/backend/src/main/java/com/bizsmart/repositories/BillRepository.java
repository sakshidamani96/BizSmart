package com.bizsmart.repositories;

import com.bizsmart.models.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findByBillNumber(String billNumber);

    List<Bill> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Bill> findAllByOrderByCreatedAtDesc();

    // Range parameters keep this portable across H2 and PostgreSQL
    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.createdAt >= :start AND b.createdAt < :end")
    BigDecimal sumSalesBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
