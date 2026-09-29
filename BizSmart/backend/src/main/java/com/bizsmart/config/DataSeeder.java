package com.bizsmart.config;

import com.bizsmart.models.*;
import com.bizsmart.repositories.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Idempotent start-up seeding.
 *  - Roles are always ensured (every ERole value must exist or sign-up/staff creation fails).
 *  - Demo data (users, suppliers, 30 products, customers, expenses) is inserted only when
 *    SEED_DEMO_DATA=true and the corresponding tables are empty, so restarts/redeploys never
 *    duplicate or overwrite real data.
 *
 * The product catalogue in resources/seed/products.json mirrors the frontend's offline catalogue,
 * so product ids line up whether the UI is online or offline.
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final ExpenseRepository expenseRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Value("${bizsmart.app.seed-demo-data:true}")
    private boolean seedDemoData;

    @Value("${DEMO_USER_PASSWORD:password123}")
    private String demoPassword;

    public DataSeeder(RoleRepository roleRepository, UserRepository userRepository,
                      CategoryRepository categoryRepository, SupplierRepository supplierRepository,
                      ProductRepository productRepository, CustomerRepository customerRepository,
                      ExpenseRepository expenseRepository, PasswordEncoder passwordEncoder,
                      ObjectMapper objectMapper) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.expenseRepository = expenseRepository;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Map<ERole, Role> roles = seedRoles();
        if (!seedDemoData) {
            logger.info("SEED_DEMO_DATA=false: skipping demo data.");
            return;
        }
        if (demoPassword == null || demoPassword.isBlank()) {
            // Render passes an empty string when the prompted variable is left blank
            demoPassword = "password123";
            logger.warn("DEMO_USER_PASSWORD not set - demo accounts use the default password. Change it for anything public.");
        }
        seedUsers(roles);
        seedSuppliers();
        seedProducts();
        seedCustomers();
        seedExpenses();
    }

    private Map<ERole, Role> seedRoles() {
        Map<ERole, Role> roles = new EnumMap<>(ERole.class);
        for (ERole name : ERole.values()) {
            roles.put(name, roleRepository.findByName(name).orElseGet(() -> roleRepository.save(new Role(name))));
        }
        return roles;
    }

    private void seedUsers(Map<ERole, Role> roles) {
        createUserIfMissing("damani", "damani@gmail.com", "Damani Retails Owner", "Store Owner", roles.get(ERole.ROLE_BUSINESS_OWNER), BigDecimal.valueOf(100000));
        createUserIfMissing("ajaysharma", "ajaysharma@gmail.com", "Ajay Sharma", "Cashier & POS Operator", roles.get(ERole.ROLE_EMPLOYEE), BigDecimal.valueOf(25000));
        createUserIfMissing("supplier", "supplier@itc.in", "Sunil Kumar", "ITC Distributor", roles.get(ERole.ROLE_SUPPLIER), BigDecimal.valueOf(35000));
        createUserIfMissing("admin", "admin@bizsmart.in", "Platform Administrator", "Platform Admin", roles.get(ERole.ROLE_PLATFORM_ADMIN), BigDecimal.valueOf(80000));
    }

    private void createUserIfMissing(String username, String email, String fullName, String title, Role role, BigDecimal salary) {
        if (Boolean.TRUE.equals(userRepository.existsByUsernameIgnoreCase(username))
                || Boolean.TRUE.equals(userRepository.existsByEmailIgnoreCase(email))) {
            return;
        }
        User user = new User(username, email, passwordEncoder.encode(demoPassword), fullName);
        user.setJobTitle(title);
        user.setRoles(new HashSet<>(Set.of(role)));
        if (salary != null) {
            user.setSalary(salary);
        }
        userRepository.save(user);
        logger.info("Seeded demo user {} ({}) with salary {}", email, role.getName(), salary);
    }

    private void seedSuppliers() {
        if (supplierRepository.count() > 0) return;
        List<Supplier> suppliers = List.of(
                new Supplier("ITC Consumer Goods Distribution", "Sunil Kumar", "+91-98200-11223", "supplier@itc.in", "Okhla Phase III, Delhi", BigDecimal.ZERO),
                new Supplier("Tata Consumer Products Hub", "Ramesh Patel", "+91-98211-44556", "tata@supply.in", "Sector 18, Gurugram", BigDecimal.ZERO),
                new Supplier("Amul Dairy Federation Depot", "Dinesh Rawat", "+91-98100-99887", "amul@depot.in", "Patparganj Industrial Area", BigDecimal.ZERO),
                new Supplier("Adani Wilmar Supply Hub", "Vikas Gupta", "+91-98999-33221", "adani@wilmar.in", "Transport Nagar, Delhi", BigDecimal.ZERO),
                new Supplier("Hindustan Unilever FMCG Depot", "Rajesh Nair", "+91-98333-77889", "hul@wholesale.in", "Naraina Industrial Area, Delhi", BigDecimal.ZERO),
                new Supplier("Nestle Regional Agency", "Pooja Mishra", "+91-98111-88990", "nestle@agency.in", "Mayapuri Phase 1, Delhi", BigDecimal.ZERO),
                new Supplier("Britannia Distribution Hub", "Sanjay Singhal", "+91-98222-33445", "britannia@hub.in", "Lawrence Road, Delhi", BigDecimal.ZERO),
                new Supplier("Parle Products Wholesale", "Manoj Tiwari", "+91-98990-44556", "parle@wholesale.in", "Kirti Nagar, Delhi", BigDecimal.ZERO)
        );
        supplierRepository.saveAll(suppliers);
    }

    private void seedProducts() {
        if (productRepository.count() > 0) return;

        List<SeedProduct> seed;
        try (InputStream in = new ClassPathResource("seed/products.json").getInputStream()) {
            seed = objectMapper.readValue(in, new TypeReference<List<SeedProduct>>() {});
        } catch (IOException e) {
            logger.warn("Could not read seed/products.json, skipping product seed: {}", e.getMessage());
            return;
        }

        Map<String, Category> categories = new HashMap<>();
        for (SeedProduct sp : seed) {
            Category category = categories.computeIfAbsent(sp.category(), name ->
                    categoryRepository.findFirstByNameIgnoreCase(name)
                            .orElseGet(() -> categoryRepository.save(new Category(name, null))));
            Supplier supplier = supplierRepository.findFirstByNameIgnoreCase(sp.supplier())
                    .orElseGet(() -> supplierRepository.save(new Supplier(sp.supplier(), null, null, null, null, BigDecimal.ZERO)));

            Product p = new Product();
            p.setSku(sp.sku());
            p.setName(sp.name());
            p.setCategory(category);
            p.setSupplier(supplier);
            p.setPurchasePrice(sp.purchasePrice());
            p.setSellingPrice(sp.sellingPrice());
            p.setQuantity(sp.quantity());
            p.setMinStock(sp.minStock());
            p.setReorderQuantity(Math.max(sp.minStock() * 3, 20));
            p.setExpiryDate(sp.expiryDate());
            productRepository.save(p);
        }
        logger.info("Seeded {} demo products.", seed.size());
    }

    private void seedCustomers() {
        if (customerRepository.count() > 0) return;
        // Walk-in first so it gets id 1, matching the POS default customer
        customerRepository.save(new Customer("Walk-in Retail Customer", null, "+91-98000-00000", null, "Local Area", BigDecimal.ZERO));
        Customer regular = new Customer("Rahul Sharma (Regular Shopper)", null, "+91-98111-22334", null, "Block B, Sector 15", BigDecimal.ZERO);
        regular.setCreditLimit(new BigDecimal("10000.00"));
        customerRepository.save(regular);
    }

    private void seedExpenses() {
        if (expenseRepository.count() > 0) return;
        LocalDate today = LocalDate.now();
        expenseRepository.saveAll(List.of(
                new Expense("Shop Floor Monthly Rent", ExpenseCategory.RENT, new BigDecimal("85000.00"), today, "Main market commercial space"),
                new Expense("Commercial Electricity Bill", ExpenseCategory.ELECTRICITY, new BigDecimal("24500.00"), today, "Cooling and lighting"),
                new Expense("Staff Salaries", ExpenseCategory.SALARY, new BigDecimal("65000.00"), today, "Cashier and helper")
        ));
    }

    /** Shape of entries in resources/seed/products.json. */
    public record SeedProduct(String sku, String name, String category, String supplier,
                       BigDecimal purchasePrice, BigDecimal sellingPrice, Integer quantity,
                       Integer minStock, LocalDate expiryDate) {
    }
}
