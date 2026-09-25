package com.bizsmart.payload.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Prices and totals are always computed on the server from the product catalogue;
 * any client-sent totals (e.g. totalAmount/unitPrice from the POS) are ignored.
 */
@Getter
@Setter
public class OrderRequest {

    /** Optional: falls back to the "Walk-in" customer when omitted. */
    private Long customerId;

    @NotEmpty
    @Size(max = 200)
    private List<@Valid OrderItemRequest> items;

    /** CASH, UPI or CREDIT (khata). Anything else is treated as CASH. */
    private String paymentMode;

    /** POS invoice number, stored for reconciliation. */
    @Size(max = 60)
    private String billNo;

    /** PENDING (default) or DELIVERED for completed counter sales. */
    private String status;

    @Getter
    @Setter
    public static class OrderItemRequest {
        @NotNull
        private Long productId;

        @NotNull
        @Min(value = 1, message = "must be at least 1")
        @Max(value = 100000, message = "is unrealistically large")
        private Integer quantity;
    }
}
