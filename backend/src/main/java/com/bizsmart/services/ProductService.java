package com.bizsmart.services;

import com.bizsmart.exceptions.ConflictException;
import com.bizsmart.exceptions.ResourceNotFoundException;
import com.bizsmart.models.Category;
import com.bizsmart.models.Product;
import com.bizsmart.models.Supplier;
import com.bizsmart.payload.request.ProductRequest;
import com.bizsmart.repositories.CategoryRepository;
import com.bizsmart.repositories.ProductRepository;
import com.bizsmart.repositories.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          SupplierRepository supplierRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
    }

    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return productRepository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }

    @Transactional(readOnly = true)
    public List<Product> getExpiringProducts(int withinDays) {
        int days = Math.max(0, Math.min(withinDays, 3650));
        return productRepository.findExpiringOnOrBefore(LocalDate.now().plusDays(days));
    }

    @Transactional(readOnly = true)
    public List<Product> searchProducts(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllProducts();
        }
        String q = query.trim();
        return productRepository.findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(q, q);
    }

    @Transactional
    public Product createProduct(ProductRequest request) {
        String sku = normaliseSku(request.getSku(), request.getName());
        if (Boolean.TRUE.equals(productRepository.existsBySkuIgnoreCase(sku))) {
            throw new ConflictException("Product with SKU " + sku + " already exists.");
        }

        Product product = new Product();
        product.setSku(sku);
        applyRequest(product, request);
        product.setMinStock(request.getSafetyStock() != null ? request.getSafetyStock() : 10);
        product.setReorderQuantity(request.getReorderQuantity() != null ? request.getReorderQuantity() : 50);
        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        if (request.getSku() != null && !request.getSku().isBlank()
                && !request.getSku().trim().equalsIgnoreCase(product.getSku())) {
            String newSku = request.getSku().trim().toUpperCase(Locale.ROOT);
            if (Boolean.TRUE.equals(productRepository.existsBySkuIgnoreCase(newSku))) {
                throw new ConflictException("Product with SKU " + newSku + " already exists.");
            }
            product.setSku(newSku);
        }

        applyRequest(product, request);
        if (request.getSafetyStock() != null) product.setMinStock(request.getSafetyStock());
        if (request.getReorderQuantity() != null) product.setReorderQuantity(request.getReorderQuantity());
        return productRepository.save(product);
    }

    @Transactional
    public Product adjustStock(Long id, int quantityDelta) {
        Product product = productRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        int newQuantity = product.getQuantity() + quantityDelta;
        if (newQuantity < 0) {
            throw new IllegalArgumentException("Stock quantity cannot be reduced below 0. Current: " + product.getQuantity());
        }
        product.setQuantity(newQuantity);
        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product", id);
        }
        // If the product is referenced by past orders, the FK violation is reported as 409 by the handler
        productRepository.deleteById(id);
        productRepository.flush();
    }

    private void applyRequest(Product product, ProductRequest request) {
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setSellingPrice(request.getPrice());
        product.setPurchasePrice(request.getCostPrice());
        product.setQuantity(request.getStockQuantity());
        if (request.getExpiryDate() != null) {
            product.setExpiryDate(request.getExpiryDate());
        }

        Category category = resolveCategory(request.getCategoryId(), request.getCategoryName());
        if (category != null) product.setCategory(category);

        Supplier supplier = resolveSupplier(request.getSupplierId(), request.getSupplierName());
        if (supplier != null) product.setSupplier(supplier);
    }

    private Category resolveCategory(Long categoryId, String categoryName) {
        if (categoryId != null) {
            return categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));
        }
        if (categoryName != null && !categoryName.isBlank()) {
            String name = categoryName.trim();
            return categoryRepository.findFirstByNameIgnoreCase(name)
                    .orElseGet(() -> categoryRepository.save(new Category(name, null)));
        }
        return null;
    }

    private Supplier resolveSupplier(Long supplierId, String supplierName) {
        if (supplierId != null) {
            return supplierRepository.findById(supplierId)
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier", supplierId));
        }
        if (supplierName != null && !supplierName.isBlank()) {
            String name = supplierName.trim();
            return supplierRepository.findFirstByNameIgnoreCase(name)
                    .orElseGet(() -> supplierRepository.save(new Supplier(name, null, null, null, null, BigDecimal.ZERO)));
        }
        return null;
    }

    private static String normaliseSku(String requestedSku, String name) {
        if (requestedSku != null && !requestedSku.isBlank()) {
            return requestedSku.trim().toUpperCase(Locale.ROOT);
        }
        String prefix = name == null ? "ITEM" : name.replaceAll("[^A-Za-z]", "").toUpperCase(Locale.ROOT);
        prefix = prefix.isEmpty() ? "ITEM" : prefix.substring(0, Math.min(4, prefix.length()));
        return "SKU-" + prefix + "-" + Long.toString(System.currentTimeMillis() % 1_000_000L, 36).toUpperCase(Locale.ROOT);
    }
}
