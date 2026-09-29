package com.bizsmart.payload.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** A payment received against a customer's khata (or paid to a supplier). */
@Getter
@Setter
public class PaymentRequest {
    @NotNull
    @DecimalMin(value = "0.01", message = "must be greater than zero")
    private BigDecimal amount;

    @Size(max = 20)
    private String mode;

    @Size(max = 255)
    private String note;
}
