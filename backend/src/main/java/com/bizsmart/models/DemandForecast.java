package com.bizsmart.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "demand_forecasts")
@Getter
@Setter
@NoArgsConstructor
public class DemandForecast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotNull
    private LocalDate forecastDate = LocalDate.now();

    @NotNull
    private Integer forecastPeriodDays = 7;

    @NotNull
    private Integer predictedUnits;

    @Column(precision = 5, scale = 4)
    private BigDecimal confidenceScore;

    private boolean reorderRecommended = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public DemandForecast(Product product, Integer forecastPeriodDays, Integer predictedUnits, BigDecimal confidenceScore, boolean reorderRecommended) {
        this.product = product;
        this.forecastPeriodDays = forecastPeriodDays;
        this.predictedUnits = predictedUnits;
        this.confidenceScore = confidenceScore;
        this.reorderRecommended = reorderRecommended;
    }
}
