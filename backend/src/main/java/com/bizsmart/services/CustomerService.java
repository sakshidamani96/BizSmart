package com.bizsmart.services;

import com.bizsmart.exceptions.ConflictException;
import com.bizsmart.exceptions.ResourceNotFoundException;
import com.bizsmart.models.Customer;
import com.bizsmart.payload.request.CustomerRequest;
import com.bizsmart.payload.request.PaymentRequest;
import com.bizsmart.repositories.CustomerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class CustomerService {

    private static final Logger logger = LoggerFactory.getLogger(CustomerService.class);

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<Customer> getAllCustomers() {
        return customerRepository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    @Transactional
    public Customer createCustomer(CustomerRequest request) {
        String email = normaliseEmail(request.getEmail());
        // Only check duplicates when an email is supplied (walk-in customers have none)
        if (email != null && Boolean.TRUE.equals(customerRepository.existsByEmailIgnoreCase(email))) {
            throw new ConflictException("Customer with email " + email + " already exists.");
        }
        Customer customer = new Customer(request.getName().trim(), email, trim(request.getPhone()),
                trim(request.getAddress()), trim(request.getCity()), BigDecimal.ZERO);
        if (request.getCreditLimit() != null) {
            customer.setCreditLimit(request.getCreditLimit());
        }
        return customerRepository.save(customer);
    }

    @Transactional
    public Customer updateCustomer(Long id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));

        String email = normaliseEmail(request.getEmail());
        if (email != null && !email.equalsIgnoreCase(customer.getEmail())
                && Boolean.TRUE.equals(customerRepository.existsByEmailIgnoreCase(email))) {
            throw new ConflictException("Customer with email " + email + " already exists.");
        }

        customer.setName(request.getName().trim());
        customer.setEmail(email);
        customer.setPhone(trim(request.getPhone()));
        customer.setAddress(trim(request.getAddress()));
        customer.setCity(trim(request.getCity()));
        if (request.getCreditLimit() != null) {
            customer.setCreditLimit(request.getCreditLimit());
        }
        return customerRepository.save(customer);
    }

    /** Records a khata (udhaar) repayment and reduces the customer's outstanding balance. */
    @Transactional
    public Customer recordPayment(Long id, PaymentRequest payment) {
        Customer customer = customerRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));

        BigDecimal outstanding = customer.getOutstandingBalance() == null ? BigDecimal.ZERO : customer.getOutstandingBalance();
        if (payment.getAmount().compareTo(outstanding) > 0) {
            throw new IllegalArgumentException("Payment of " + payment.getAmount()
                    + " exceeds the outstanding balance of " + outstanding + ".");
        }
        customer.setOutstandingBalance(outstanding.subtract(payment.getAmount()));
        logger.info("Khata payment of {} received from customer {} via {} ({})", payment.getAmount(),
                id, payment.getMode() == null ? "CASH" : payment.getMode(), payment.getNote());
        return customerRepository.save(customer);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
        if (customer.getOutstandingBalance() != null && customer.getOutstandingBalance().signum() > 0) {
            throw new ConflictException("Cannot delete a customer with an outstanding khata balance.");
        }
        customerRepository.delete(customer);
        customerRepository.flush();
    }

    private static String normaliseEmail(String email) {
        return (email == null || email.isBlank()) ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }
}
