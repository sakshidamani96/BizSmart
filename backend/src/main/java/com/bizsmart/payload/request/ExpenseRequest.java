package com.bizsmart.payload.request;

import com.bizsmart.models.ExpenseCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class ExpenseRequest {
    @NotBlank
    @Size(max = 150)
    private String title;

    /** RENT, ELECTRICITY, SALARY, LOGISTICS, PACKAGING, MAINTENANCE or MISC. */
    @NotNull
    private ExpenseCategory category;

    @NotNull
    @DecimalMin(value = "0.01", message = "must be greater than zero")
    private BigDecimal amount;

    /** Defaults to today. */
    private LocalDate expenseDate;

    private String notes;
}
