package com.bizsmart.repositories;

import com.bizsmart.models.Customer;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByEmail(String email);

    Boolean existsByEmail(String email);

    Boolean existsByEmailIgnoreCase(String email);

    Boolean existsByPhone(String phone);

    List<Customer> findByNameContainingIgnoreCase(String name);

    List<Customer> findAllByOrderByNameAsc();

    Optional<Customer> findFirstByNameIgnoreCase(String name);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Customer c WHERE c.id = :id")
    Optional<Customer> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT COALESCE(SUM(c.outstandingBalance), 0) FROM Customer c")
    BigDecimal calculateTotalOutstanding();
}
