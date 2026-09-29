package com.bizsmart.payload.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class DemandPredictionClientRequest {
    @JsonProperty("product_id")
    private Long productId;

    private String sku;
    private String name;
    private Integer category;
    private Double price;

    @JsonProperty("discount_percent")
    private Double discountPercent;

    @JsonProperty("past_7_days_sales")
    private Double past7DaysSales;

    @JsonProperty("past_30_days_sales")
    private Double past30DaysSales;

    @JsonProperty("lead_time_days")
    private Integer leadTimeDays;

    @JsonProperty("stock_quantity")
    private Integer stockQuantity;

    private Integer month;
}
