package com.bizsmart.services;

import com.bizsmart.models.Order;
import com.bizsmart.models.OrderItem;
import com.bizsmart.models.OrderStatus;
import com.bizsmart.models.Product;
import com.bizsmart.payload.response.DashboardSummaryResponse;
import com.bizsmart.repositories.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;

@Service
public class AnalyticsService {

    private static final int EXPIRY_WARNING_DAYS = 30;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final ExpenseRepository expenseRepository;
    private final SupplierRepository supplierRepository;

    public AnalyticsService(OrderRepository orderRepository, ProductRepository productRepository,
                            CustomerRepository customerRepository, ExpenseRepository expenseRepository,
                            SupplierRepository supplierRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.expenseRepository = expenseRepository;
        this.supplierRepository = supplierRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        List<Product> lowStockProducts = productRepository.findLowStockProducts();

        // Orders from the start of the month (or the last 7 days, whichever is earlier) drive the KPIs
        LocalDate windowStart = monthStart.isBefore(today.minusDays(6)) ? monthStart : today.minusDays(6);
        List<Order> recentWindow = orderRepository.findByCreatedAtGreaterThanEqualAndStatusNot(
                windowStart.atStartOfDay(), OrderStatus.CANCELLED);

        BigDecimal todayRevenue = BigDecimal.ZERO;
        BigDecimal monthRevenue = BigDecimal.ZERO;
        for (Order o : recentWindow) {
            LocalDate d = o.getCreatedAt().toLocalDate();
            if (!d.isBefore(monthStart)) monthRevenue = monthRevenue.add(o.getTotalAmount());
            if (d.isEqual(today)) todayRevenue = todayRevenue.add(o.getTotalAmount());
        }
        BigDecimal monthExpenses = nz(expenseRepository.sumBetween(monthStart, today));

        List<Map<String, Object>> salesTrend = buildSalesTrend(recentWindow, today);

        List<Map<String, Object>> recentOrders = orderRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5)).stream().map(o -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", o.getId());
                    map.put("orderNumber", o.getOrderNumber());
                    map.put("customerName", o.getCustomer() != null ? o.getCustomer().getName() : "Walk-in");
                    map.put("totalAmount", o.getTotalAmount());
                    map.put("status", o.getStatus().name());
                    map.put("paymentMode", o.getPaymentMode() != null ? o.getPaymentMode().name() : null);
                    map.put("createdAt", o.getCreatedAt().toString());
                    return map;
                }).toList();

        List<Map<String, Object>> lowStockAlerts = lowStockProducts.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("sku", p.getSku());
            map.put("name", p.getName());
            map.put("stockQuantity", p.getQuantity());
            map.put("safetyStock", p.getMinStock());
            map.put("reorderQuantity", p.getReorderQuantity());
            return map;
        }).toList();

        List<Map<String, Object>> topProducts = orderRepository
                .findTopSellingProductsSince(today.minusDays(29).atStartOfDay(), PageRequest.of(0, 5))
                .stream().map(row -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("productId", row[0]);
                    map.put("name", row[1]);
                    map.put("unitsSold", row[2]);
                    map.put("revenue", row[3]);
                    return map;
                }).toList();

        return DashboardSummaryResponse.builder()
                .totalRevenue(nz(orderRepository.calculateTotalRevenue()))
                .totalProducts(productRepository.count())
                .lowStockCount(lowStockProducts.size())
                .totalCustomers(customerRepository.count())
                .totalOrders(orderRepository.count())
                .pendingOrders(orderRepository.countPendingOrders())
                .recentOrders(recentOrders)
                .lowStockAlerts(lowStockAlerts)
                .demandTrends(toDemandTrends(salesTrend))
                .todayRevenue(todayRevenue)
                .monthRevenue(monthRevenue)
                .monthExpenses(monthExpenses)
                .monthNetProfit(monthRevenue.subtract(monthExpenses))
                .inventoryValueAtCost(nz(productRepository.calculateInventoryValueAtCost()))
                .outstandingKhata(nz(customerRepository.calculateTotalOutstanding()))
                .supplierDues(nz(supplierRepository.calculateTotalSupplierDues()))
                .expiringSoonCount(productRepository.findExpiringOnOrBefore(today.plusDays(EXPIRY_WARNING_DAYS)).size())
                .salesTrend(salesTrend)
                .topProducts(topProducts)
                .build();
    }

    /** One entry per day for the last 7 days (oldest first), including days with no sales. */
    private List<Map<String, Object>> buildSalesTrend(List<Order> orders, LocalDate today) {
        Map<LocalDate, BigDecimal> revenue = new TreeMap<>();
        Map<LocalDate, Integer> orderCount = new HashMap<>();
        Map<LocalDate, Integer> units = new HashMap<>();
        for (int i = 6; i >= 0; i--) {
            revenue.put(today.minusDays(i), BigDecimal.ZERO);
        }
        for (Order o : orders) {
            LocalDate d = o.getCreatedAt().toLocalDate();
            if (!revenue.containsKey(d)) continue;
            revenue.merge(d, o.getTotalAmount(), BigDecimal::add);
            orderCount.merge(d, 1, Integer::sum);
            int u = o.getItems().stream().mapToInt(OrderItem::getQuantity).sum();
            units.merge(d, u, Integer::sum);
        }
        List<Map<String, Object>> trend = new ArrayList<>();
        revenue.forEach((date, amount) -> {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", date.toString());
            point.put("day", date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            point.put("revenue", amount);
            point.put("orders", orderCount.getOrDefault(date, 0));
            point.put("units", units.getOrDefault(date, 0));
            trend.add(point);
        });
        return trend;
    }

    /** Backward-compatible chart shape: actual units per day and their running average. */
    private List<Map<String, Object>> toDemandTrends(List<Map<String, Object>> salesTrend) {
        List<Map<String, Object>> result = new ArrayList<>();
        int runningTotal = 0;
        for (int i = 0; i < salesTrend.size(); i++) {
            int actual = (Integer) salesTrend.get(i).get("units");
            runningTotal += actual;
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", salesTrend.get(i).get("day"));
            point.put("actual", actual);
            point.put("predicted", BigDecimal.valueOf(runningTotal)
                    .divide(BigDecimal.valueOf(i + 1), 0, RoundingMode.HALF_UP).intValue());
            result.add(point);
        }
        return result;
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
