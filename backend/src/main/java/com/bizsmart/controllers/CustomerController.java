package com.bizsmart.controllers;

import com.bizsmart.exceptions.ResourceNotFoundException;
import com.bizsmart.models.Customer;
import com.bizsmart.payload.request.CustomerRequest;
import com.bizsmart.payload.request.PaymentRequest;
import com.bizsmart.payload.response.MessageResponse;
import com.bizsmart.security.Roles;
import com.bizsmart.services.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@PreAuthorize(Roles.STORE_STAFF)
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerService.getAllCustomers();
    }

    @GetMapping("/{id}")
    public Customer getCustomerById(@PathVariable Long id) {
        return customerService.getCustomerById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
    }

    @PostMapping
    public ResponseEntity<Customer> createCustomer(@Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerService.createCustomer(request));
    }

    @PutMapping("/{id}")
    public Customer updateCustomer(@PathVariable Long id, @Valid @RequestBody CustomerRequest request) {
        return customerService.updateCustomer(id, request);
    }

    /** Record a khata repayment: { "amount": 500, "mode": "UPI", "note": "..." } */
    @PostMapping("/{id}/payments")
    public Customer recordPayment(@PathVariable Long id, @Valid @RequestBody PaymentRequest request) {
        return customerService.recordPayment(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(Roles.OWNER)
    public MessageResponse deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return new MessageResponse("Customer deleted successfully.");
    }
}
