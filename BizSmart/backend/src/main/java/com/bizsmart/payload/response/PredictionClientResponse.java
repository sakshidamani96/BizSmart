package com.bizsmart.payload.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PredictionClientResponse {
    @JsonProperty("product_id")
    private Long productId;

    private String sku;

    @JsonProperty("forecast_period_days")
    private Integer forecastPeriodDays;

    @JsonProperty("predicted_demand")
    private Integer predictedDemand;

    @JsonProperty("current_stock")
    private Integer currentStock;

    @JsonProperty("net_stock_after_period")
    private Integer netStockAfterPeriod;

    @JsonProperty("reorder_recommended")
    private Boolean reorderRecommended;

    @JsonProperty("suggested_reorder_qty")
    private Integer suggestedReorderQty;

    @JsonProperty("confidence_score")
    private Double confidenceScore;

    @JsonProperty("risk_level")
    private String riskLevel;

    @JsonProperty("daily_breakdown")
    private List<DailyBreakdown> dailyBreakdown;

    @JsonProperty("created_at")
    private String createdAt;

    @Getter
    @Setter
    public static class DailyBreakdown {
        private Integer day;

        @JsonProperty("day_name")
        private String dayName;

        @JsonProperty("expected_units")
        private Integer expectedUnits;
    }
}
