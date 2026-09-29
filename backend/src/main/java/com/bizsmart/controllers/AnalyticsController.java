package com.bizsmart.controllers;

import com.bizsmart.models.DemandForecast;
import com.bizsmart.payload.response.DashboardSummaryResponse;
import com.bizsmart.payload.response.PredictionClientResponse;
import com.bizsmart.security.Roles;
import com.bizsmart.services.AnalyticsService;
import com.bizsmart.services.DemandPredictionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@PreAuthorize(Roles.MANAGEMENT)
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final DemandPredictionService demandPredictionService;

    public AnalyticsController(AnalyticsService analyticsService, DemandPredictionService demandPredictionService) {
        this.analyticsService = analyticsService;
        this.demandPredictionService = demandPredictionService;
    }

    @GetMapping("/dashboard")
    public DashboardSummaryResponse getDashboardSummary() {
        return analyticsService.getDashboardSummary();
    }

    @PostMapping("/forecast/{productId}")
    public PredictionClientResponse generateForecast(
            @PathVariable Long productId,
            @RequestParam(required = false, defaultValue = "0.0") Double discountPercent,
            @RequestParam(required = false, defaultValue = "7") Integer leadTimeDays) {
        return demandPredictionService.forecastProductDemand(productId, discountPercent, leadTimeDays);
    }

    @GetMapping("/forecast/history/{productId}")
    public List<DemandForecast> getForecastHistory(@PathVariable Long productId) {
        return demandPredictionService.getForecastHistory(productId);
    }

    @GetMapping("/forecast/reorder-alerts")
    public List<DemandForecast> getReorderAlerts() {
        return demandPredictionService.getActiveReorderRecommendations();
    }
}
