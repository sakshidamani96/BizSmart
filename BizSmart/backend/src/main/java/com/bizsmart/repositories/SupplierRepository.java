package com.bizsmart.repositories;

import com.bizsmart.models.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findByNameContainingIgnoreCase(String name);

    Optional<Supplier> findFirstByNameIgnoreCase(String name);

    List<Supplier> findAllByOrderByNameAsc();

    @Query("SELECT COALESCE(SUM(s.pendingDues), 0) FROM Supplier s")
    BigDecimal calculateTotalSupplierDues();
}
