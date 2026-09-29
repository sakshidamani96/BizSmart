package com.bizsmart.payload.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** Client-editable customer fields. Balances are only changed through sales and khata payments. */
@Getter
@Setter
public class CustomerRequest {
    @NotBlank
    @Size(max = 120)
    private String name;

    @Email
    @Size(max = 120)
    private String email;

    @Size(max = 30)
    private String phone;

    @Size(max = 255)
    private String address;

    @Size(max = 80)
    private String city;

    @DecimalMin("0.0")
    @JsonAlias("limit")
    private BigDecimal creditLimit;
}
