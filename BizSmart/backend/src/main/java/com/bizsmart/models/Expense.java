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
@Table(name = "expenses")
@Getter
@Setter
@NoArgsConstructor
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(length = 150, nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false)
    private ExpenseCategory category;

    @NotNull
    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    @NotNull
    private LocalDate expenseDate = LocalDate.now();

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Expense(String title, ExpenseCategory category, BigDecimal amount, LocalDate expenseDate, String notes) {
        this.title = title;
        this.category = category;
        this.amount = amount;
        this.expenseDate = expenseDate != null ? expenseDate : LocalDate.now();
        this.notes = notes;
    }
}
