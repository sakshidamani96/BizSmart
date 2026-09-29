package com.bizsmart.payload.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
public class DashboardSummaryResponse {
    // Original fields (kept for backward compatibility)
    private BigDecimal totalRevenue;
    private long totalProducts;
    private long lowStockCount;
    private long totalCustomers;
    private long totalOrders;
    private long pendingOrders;
    private List<Map<String, Object>> recentOrders;
    private List<Map<String, Object>> lowStockAlerts;
    /** Last 7 days: units actually sold vs. their trailing average (was hard-coded sample data before). */
    private List<Map<String, Object>> demandTrends;

    // Business health KPIs
    private BigDecimal todayRevenue;
    private BigDecimal monthRevenue;
    private BigDecimal monthExpenses;
    private BigDecimal monthNetProfit;
    private BigDecimal inventoryValueAtCost;
    private BigDecimal outstandingKhata;
    private BigDecimal supplierDues;
    private long expiringSoonCount;
    /** Last 7 days: date, revenue, orders, units. */
    private List<Map<String, Object>> salesTrend;
    /** Best sellers over the last 30 days: productId, name, unitsSold, revenue. */
    private List<Map<String, Object>> topProducts;
}
