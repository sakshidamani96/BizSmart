package com.bizsmart.services;

import com.bizsmart.exceptions.ConflictException;
import com.bizsmart.exceptions.ResourceNotFoundException;
import com.bizsmart.models.*;
import com.bizsmart.payload.request.OrderRequest;
import com.bizsmart.repositories.CustomerRepository;
import com.bizsmart.repositories.OrderRepository;
import com.bizsmart.repositories.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class OrderService {

    static final String WALK_IN_CUSTOMER_NAME = "Walk-in Retail Customer";

    /** Allowed status transitions; DELIVERED and CANCELLED are terminal. */
    private static final Map<OrderStatus, Set<OrderStatus>> TRANSITIONS = Map.of(
            OrderStatus.PENDING, EnumSet.of(OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED),
            OrderStatus.PROCESSING, EnumSet.of(OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED),
            OrderStatus.SHIPPED, EnumSet.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED),
            OrderStatus.DELIVERED, EnumSet.noneOf(OrderStatus.class),
            OrderStatus.CANCELLED, EnumSet.noneOf(OrderStatus.class)
    );

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, CustomerRepository customerRepository,
                        ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Transactional
    public Order createOrder(OrderRequest request) {
        Customer customer = resolveCustomer(request.getCustomerId());
        PaymentMode paymentMode = parsePaymentMode(request.getPaymentMode());

        Order order = new Order();
        order.setCustomer(customer);
        order.setPaymentMode(paymentMode);
        order.setExternalReference(request.getBillNo());
        order.setOrderNumber("ORD-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
        order.setStatus(parseInitialStatus(request.getStatus()));

        // Merge duplicate lines for the same product so stock checks are accurate
        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
            quantities.merge(itemReq.getProductId(), itemReq.getQuantity(), Integer::sum);
        }

        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> line : quantities.entrySet()) {
            // Row lock prevents two concurrent sales from overselling the same product
            Product product = productRepository.findByIdForUpdate(line.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", line.getKey()));
            int requested = line.getValue();

            if (product.getQuantity() < requested) {
                throw new ConflictException("Insufficient inventory for '" + product.getName()
                        + "'. Available: " + product.getQuantity() + ", requested: " + requested);
            }

            product.setQuantity(product.getQuantity() - requested);
            productRepository.save(product);

            OrderItem orderItem = new OrderItem(product, requested, product.getSellingPrice());
            order.addItem(orderItem);
            total = total.add(orderItem.getSubtotal());
        }
        order.setTotalAmount(total);

        if (paymentMode == PaymentMode.CREDIT) {
            // Udhaar / khata sale: the amount is added to the customer's outstanding balance
            Customer locked = customerRepository.findByIdForUpdate(customer.getId()).orElse(customer);
            locked.setOutstandingBalance(nz(locked.getOutstandingBalance()).add(total));
            customerRepository.save(locked);
        }

        return orderRepository.save(order);
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        OrderStatus current = order.getStatus();
        if (current == newStatus) {
            return order;
        }
        if (!TRANSITIONS.getOrDefault(current, Set.of()).contains(newStatus)) {
            throw new ConflictException("Cannot change order status from " + current + " to " + newStatus + ".");
        }

        if (newStatus == OrderStatus.CANCELLED) {
            // Restore stock
            for (OrderItem item : order.getItems()) {
                Product product = productRepository.findByIdForUpdate(item.getProduct().getId())
                        .orElse(item.getProduct());
                product.setQuantity(product.getQuantity() + item.getQuantity());
                productRepository.save(product);
            }
            // Reverse a khata charge
            if (order.getPaymentMode() == PaymentMode.CREDIT && order.getCustomer() != null) {
                Customer customer = customerRepository.findByIdForUpdate(order.getCustomer().getId())
                        .orElse(order.getCustomer());
                BigDecimal reduced = nz(customer.getOutstandingBalance()).subtract(nz(order.getTotalAmount()));
                customer.setOutstandingBalance(reduced.max(BigDecimal.ZERO));
                customerRepository.save(customer);
            }
        }

        order.setStatus(newStatus);
        return orderRepository.save(order);
    }

    private Customer resolveCustomer(Long customerId) {
        if (customerId != null) {
            return customerRepository.findById(customerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));
        }
        return customerRepository.findFirstByNameIgnoreCase(WALK_IN_CUSTOMER_NAME)
                .orElseGet(() -> customerRepository.save(
                        new Customer(WALK_IN_CUSTOMER_NAME, null, null, null, null, BigDecimal.ZERO)));
    }

    private static PaymentMode parsePaymentMode(String raw) {
        if (raw == null || raw.isBlank()) return PaymentMode.CASH;
        String value = raw.trim().toUpperCase(Locale.ROOT);
        if (value.equals("KHATA") || value.equals("UDHAAR")) return PaymentMode.CREDIT;
        try {
            return PaymentMode.valueOf(value);
        } catch (IllegalArgumentException ex) {
            return PaymentMode.CASH;
        }
    }

    private static OrderStatus parseInitialStatus(String raw) {
        if (raw == null || raw.isBlank()) return OrderStatus.PENDING;
        String value = raw.trim().toUpperCase(Locale.ROOT);
        if (value.equals("DELIVERED") || value.equals("COMPLETED")) return OrderStatus.DELIVERED;
        return OrderStatus.PENDING;
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
