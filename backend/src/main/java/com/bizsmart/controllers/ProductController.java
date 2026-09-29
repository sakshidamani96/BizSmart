package com.bizsmart.controllers;

import com.bizsmart.exceptions.ResourceNotFoundException;
import com.bizsmart.models.Product;
import com.bizsmart.payload.request.ProductRequest;
import com.bizsmart.payload.response.MessageResponse;
import com.bizsmart.security.Roles;
import com.bizsmart.services.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<Product> getAllProducts(@RequestParam(required = false) String search) {
        return productService.searchProducts(search);
    }

    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    @GetMapping("/low-stock")
    public List<Product> getLowStockProducts() {
        return productService.getLowStockProducts();
    }

    /** Products expiring within the given number of days (already-expired items included). */
    @GetMapping("/expiring")
    public List<Product> getExpiringProducts(@RequestParam(defaultValue = "30") int days) {
        return productService.getExpiringProducts(days);
    }

    @PostMapping
    @PreAuthorize(Roles.MANAGEMENT)
    public ResponseEntity<Product> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize(Roles.MANAGEMENT)
    public Product updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return productService.updateProduct(id, request);
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize(Roles.STORE_STAFF)
    public Product adjustStock(@PathVariable Long id, @RequestParam int delta) {
        return productService.adjustStock(id, delta);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(Roles.OWNER)
    public MessageResponse deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return new MessageResponse("Product deleted successfully.");
    }
}
