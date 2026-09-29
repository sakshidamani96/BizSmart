package com.bizsmart.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(length = 60, unique = true, nullable = false)
    private String sku;

    @NotBlank
    @Column(length = 150, nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @NotNull
    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal sellingPrice = BigDecimal.ZERO;

    // Backward-compat aliases
    public BigDecimal getPrice() { return sellingPrice; }
    public void setPrice(BigDecimal p) { this.sellingPrice = p; }
    public BigDecimal getCostPrice() { return purchasePrice; }
    public void setCostPrice(BigDecimal p) { this.purchasePrice = p; }

    @Column(nullable = false)
    private Integer quantity = 0;

    // Backward-compat alias for stockQuantity
    public Integer getStockQuantity() { return quantity; }
    public void setStockQuantity(Integer q) { this.quantity = q; }

    @Column(nullable = false)
    private Integer minStock = 10;

    public Integer getSafetyStock() { return minStock; }
    public void setSafetyStock(Integer s) { this.minStock = s; }

    @Column(nullable = false)
    private Integer reorderQuantity = 50;

    private LocalDate expiryDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public boolean isLowStock() {
        return this.quantity <= this.minStock;
    }

    public boolean isNearExpiry(int daysThreshold) {
        if (expiryDate == null) return false;
        return expiryDate.isBefore(LocalDate.now().plusDays(daysThreshold));
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
