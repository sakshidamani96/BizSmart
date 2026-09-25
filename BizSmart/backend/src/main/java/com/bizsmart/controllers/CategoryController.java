package com.bizsmart.controllers;

import com.bizsmart.exceptions.ConflictException;
import com.bizsmart.models.Category;
import com.bizsmart.repositories.CategoryRepository;
import com.bizsmart.security.Roles;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public List<Category> getAll() {
        return categoryRepository.findAllByOrderByNameAsc();
    }

    @PostMapping
    @PreAuthorize(Roles.MANAGEMENT)
    public ResponseEntity<Category> create(@Valid @RequestBody Category category) {
        String name = category.getName().trim();
        if (categoryRepository.findFirstByNameIgnoreCase(name).isPresent()) {
            throw new ConflictException("Category '" + name + "' already exists.");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(categoryRepository.save(new Category(name, category.getDescription())));
    }
}
