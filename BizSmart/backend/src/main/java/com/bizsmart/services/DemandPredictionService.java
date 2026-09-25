package com.bizsmart.services;

import com.bizsmart.models.DemandForecast;
import com.bizsmart.models.Product;
import com.bizsmart.payload.request.DemandPredictionClientRequest;
import com.bizsmart.payload.response.PredictionClientResponse;
import com.bizsmart.repositories.DemandForecastRepository;
import com.bizsmart.repositories.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class DemandPredictionService {
    private static final Logger logger = LoggerFactory.getLogger(DemandPredictionService.class);

    @Value("${bizsmart.ml-service.url:}")
    private String mlServiceUrl;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private DemandForecastRepository demandForecastRepository;

    private final RestTemplate restTemplate;

    public DemandPredictionService(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Transactional
    public PredictionClientResponse forecastProductDemand(Long productId, Double discountPercent, Integer leadTimeDays) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new com.bizsmart.exceptions.ResourceNotFoundException("Product", productId));

        int categoryIdx = 0;
        if (product.getCategory() != null) {
            String catName = product.getCategory().getName().toLowerCase();
            if (catName.contains("apparel")) categoryIdx = 1;
            else if (catName.contains("home") || catName.contains("kitchen")) categoryIdx = 2;
            else if (catName.contains("office")) categoryIdx = 3;
        }

        double past7 = Math.max(5.0, (product.getReorderQuantity() / 2.0));
        double past30 = past7 * 4.2;

        DemandPredictionClientRequest clientRequest = DemandPredictionClientRequest.builder()
                .productId(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .category(categoryIdx)
                .price(product.getPrice().doubleValue())
                .discountPercent(discountPercent != null ? discountPercent : 0.0)
                .past7DaysSales(past7)
                .past30DaysSales(past30)
                .leadTimeDays(leadTimeDays != null ? leadTimeDays : 7)
                .stockQuantity(product.getStockQuantity())
                .month(LocalDate.now().getMonthValue())
                .build();

        PredictionClientResponse response;
        if (mlServiceUrl == null || mlServiceUrl.isBlank()) {
            // No external forecasting service configured: use the built-in heuristic directly
            response = generateFallbackPrediction(product, clientRequest);
        } else {
            response = callForecastService(product, clientRequest);
        }

        if (response != null) {
            persist(product, response);
        }
        return response;
    }

    private PredictionClientResponse callForecastService(Product product, DemandPredictionClientRequest clientRequest) {
        PredictionClientResponse response;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<DemandPredictionClientRequest> entity = new HttpEntity<>(clientRequest, headers);

            ResponseEntity<PredictionClientResponse> apiResponse = restTemplate.postForEntity(
                    mlServiceUrl + "/predict", entity, PredictionClientResponse.class);

            response = apiResponse.getBody();
            logger.info("Successfully fetched ML forecast for SKU {}: {} predicted units",
                    product.getSku(), response != null ? response.getPredictedDemand() : "null");
        } catch (Exception ex) {
            logger.warn("ML Service unavailable at {}. Generating intelligent fallback prediction. Reason: {}",
                    mlServiceUrl, ex.getMessage());
            response = generateFallbackPrediction(product, clientRequest);
        }
        return response;
    }

    private void persist(Product product, PredictionClientResponse response) {
        DemandForecast forecast = new DemandForecast(
                product,
                response.getForecastPeriodDays() != null ? response.getForecastPeriodDays() : 7,
                response.getPredictedDemand() != null ? response.getPredictedDemand() : 0,
                BigDecimal.valueOf(response.getConfidenceScore() != null ? response.getConfidenceScore() : 0.0),
                Boolean.TRUE.equals(response.getReorderRecommended())
        );
        demandForecastRepository.save(forecast);
    }

    public List<DemandForecast> getForecastHistory(Long productId) {
        return demandForecastRepository.findByProductIdOrderByForecastDateDesc(productId);
    }

    public List<DemandForecast> getActiveReorderRecommendations() {
        return demandForecastRepository.findByReorderRecommendedTrue();
    }

    private PredictionClientResponse generateFallbackPrediction(Product product, DemandPredictionClientRequest req) {
        int estimatedDemand = (int) Math.round(req.getPast7DaysSales() * (1.0 + (req.getDiscountPercent() * 0.015)));
        boolean reorder = product.getStockQuantity() < (estimatedDemand + product.getSafetyStock());
        int suggestedReorder = reorder ? Math.max(0, product.getReorderQuantity()) : 0;

        PredictionClientResponse fallback = new PredictionClientResponse();
        fallback.setProductId(product.getId());
        fallback.setSku(product.getSku());
        fallback.setForecastPeriodDays(7);
        fallback.setPredictedDemand(estimatedDemand);
        fallback.setCurrentStock(product.getStockQuantity());
        fallback.setNetStockAfterPeriod(product.getStockQuantity() - estimatedDemand);
        fallback.setReorderRecommended(reorder);
        fallback.setSuggestedReorderQty(suggestedReorder);
        fallback.setConfidenceScore(0.80);
        fallback.setRiskLevel(product.getStockQuantity() <= product.getSafetyStock() ? "CRITICAL" : "MODERATE");

        List<PredictionClientResponse.DailyBreakdown> daily = new ArrayList<>();
        String[] dayNames = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        for (int i = 0; i < 7; i++) {
            PredictionClientResponse.DailyBreakdown d = new PredictionClientResponse.DailyBreakdown();
            d.setDay(i + 1);
            d.setDayName(dayNames[i]);
            d.setExpectedUnits(Math.max(1, estimatedDemand / 7));
            daily.add(d);
        }
        fallback.setDailyBreakdown(daily);
        return fallback;
    }
}
