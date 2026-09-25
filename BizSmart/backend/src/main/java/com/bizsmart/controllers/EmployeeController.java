package com.bizsmart.controllers;

import com.bizsmart.models.ERole;
import com.bizsmart.models.User;
import com.bizsmart.payload.request.SignupRequest;
import com.bizsmart.security.Roles;
import com.bizsmart.services.UserAccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Staff accounts are created and managed by the store owner. */
@RestController
@RequestMapping("/api/employees")
@PreAuthorize(Roles.OWNER)
public class EmployeeController {

    private final UserAccountService userAccountService;

    public EmployeeController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @GetMapping
    public List<User> getAllEmployees() {
        return userAccountService.listStaff();
    }

    /**
     * Creates a staff login. Pass roles=["MANAGER"] to create a manager; anything else creates an employee.
     * A password is required (no hidden default passwords).
     */
    @PostMapping
    public ResponseEntity<User> addEmployee(@Valid @RequestBody SignupRequest request) {
        boolean manager = request.getRoles() != null && request.getRoles().stream()
                .anyMatch(r -> r != null && r.toUpperCase().contains("MANAGER"));
        User saved = userAccountService.createUser(request, manager ? ERole.ROLE_MANAGER : ERole.ROLE_EMPLOYEE);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** Deactivate (active=false) or reactivate a staff login. Deactivated users cannot sign in. */
    @PatchMapping("/{id}/status")
    public User updateStatus(@PathVariable Long id, @RequestParam boolean active) {
        return userAccountService.setActive(id, active);
    }
}
