package com.bizsmart.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "suppliers")
@Getter
@Setter
@NoArgsConstructor
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(length = 150, nullable = false)
    private String name;

    @Column(length = 100)
    private String contactPerson;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 255)
    private String address;

    @Column(precision = 12, scale = 2)
    private BigDecimal pendingDues = BigDecimal.ZERO;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Supplier(String name, String contactPerson, String phone, String email, String address, BigDecimal pendingDues) {
        this.name = name;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.pendingDues = pendingDues != null ? pendingDues : BigDecimal.ZERO;
    }
}
