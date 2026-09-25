package com.bizsmart.controllers;

import com.bizsmart.exceptions.ResourceNotFoundException;
import com.bizsmart.models.Supplier;
import com.bizsmart.payload.request.PaymentRequest;
import com.bizsmart.payload.response.MessageResponse;
import com.bizsmart.repositories.SupplierRepository;
import com.bizsmart.security.Roles;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierRepository supplierRepository;

    public SupplierController(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @GetMapping
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAllByOrderByNameAsc();
    }

    @GetMapping("/{id}")
    public Supplier getSupplierById(@PathVariable Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
    }

    @PostMapping
    @PreAuthorize(Roles.MANAGEMENT)
    public ResponseEntity<Supplier> createSupplier(@Valid @RequestBody Supplier supplier) {
        supplier.setId(null); // never let the client choose/overwrite an existing id
        if (supplier.getPendingDues() == null) supplier.setPendingDues(BigDecimal.ZERO);
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierRepository.save(supplier));
    }

    @PutMapping("/{id}")
    @PreAuthorize(Roles.MANAGEMENT)
    public Supplier updateSupplier(@PathVariable Long id, @Valid @RequestBody Supplier changes) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
        supplier.setName(changes.getName());
        supplier.setContactPerson(changes.getContactPerson());
        supplier.setPhone(changes.getPhone());
        supplier.setEmail(changes.getEmail());
        supplier.setAddress(changes.getAddress());
        return supplierRepository.save(supplier);
    }

    /** Record a payment made to the supplier; reduces pending dues. */
    @PostMapping("/{id}/payments")
    @PreAuthorize(Roles.OWNER)
    @Transactional
    public Supplier recordPayment(@PathVariable Long id, @Valid @RequestBody PaymentRequest payment) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
        BigDecimal dues = supplier.getPendingDues() == null ? BigDecimal.ZERO : supplier.getPendingDues();
        if (payment.getAmount().compareTo(dues) > 0) {
            throw new IllegalArgumentException("Payment exceeds pending dues of " + dues + ".");
        }
        supplier.setPendingDues(dues.subtract(payment.getAmount()));
        return supplierRepository.save(supplier);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(Roles.OWNER)
    public MessageResponse deleteSupplier(@PathVariable Long id) {
        if (!supplierRepository.existsById(id)) {
            throw new ResourceNotFoundException("Supplier", id);
        }
        supplierRepository.deleteById(id);
        supplierRepository.flush();
        return new MessageResponse("Supplier deleted successfully.");
    }
}
