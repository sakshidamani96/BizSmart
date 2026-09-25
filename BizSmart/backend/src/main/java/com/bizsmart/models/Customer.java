package com.bizsmart.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(length = 120, nullable = false)
    private String name;

    @Email
    @Column(length = 120, unique = true)
    private String email;

    @Column(length = 30)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(length = 80)
    private String city;

    @Column(precision = 12, scale = 2)
    private BigDecimal outstandingBalance = BigDecimal.ZERO; // Udhaar / Credit balance

    @Column(precision = 12, scale = 2)
    private BigDecimal creditLimit = new BigDecimal("5000.00");

    private LocalDateTime createdAt = LocalDateTime.now();

    public Customer(String name, String email, String phone, String address, String city, BigDecimal outstandingBalance) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.outstandingBalance = outstandingBalance != null ? outstandingBalance : BigDecimal.ZERO;
    }
}
