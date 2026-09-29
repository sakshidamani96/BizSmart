package com.bizsmart.payload.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Accepts both naming styles used in the codebase:
 *  - API style:      price / costPrice / stockQuantity / safetyStock / categoryId
 *  - Frontend style: sellingPrice / purchasePrice / quantity / minStock / categoryName / supplierName
 */
@Getter
@Setter
public class ProductRequest {
    /** Optional: generated from the name when blank. */
    @Size(max = 60)
    private String sku;

    @NotBlank
    @Size(max = 150)
    private String name;

    private String description;

    @NotNull
    @DecimalMin(value = "0.0", message = "must be zero or positive")
    @JsonAlias("sellingPrice")
    private BigDecimal price;

    @NotNull
    @DecimalMin(value = "0.0", message = "must be zero or positive")
    @JsonAlias("purchasePrice")
    private BigDecimal costPrice;

    @NotNull
    @Min(0)
    @JsonAlias("quantity")
    private Integer stockQuantity;

    @Min(0)
    @JsonAlias("minStock")
    private Integer safetyStock;

    @Min(0)
    private Integer reorderQuantity;

    private LocalDate expiryDate;

    private Long categoryId;

    /** Used when categoryId is absent; the category is created if it does not exist. */
    @Size(max = 100)
    private String categoryName;

    private Long supplierId;

    /** Used when supplierId is absent; the supplier is created if it does not exist. */
    @Size(max = 150)
    private String supplierName;
}
