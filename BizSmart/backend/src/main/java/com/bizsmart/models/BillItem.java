package com.bizsmart.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "bill_items")
@Getter
@Setter
@NoArgsConstructor
public class BillItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotNull
    @Column(nullable = false)
    private Integer quantity;

    @NotNull
    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal sellingPrice;

    @NotNull
    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal subtotal;

    public BillItem(Product product, Integer quantity, BigDecimal sellingPrice) {
        this.product = product;
        this.quantity = quantity;
        this.sellingPrice = sellingPrice;
        this.subtotal = sellingPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
