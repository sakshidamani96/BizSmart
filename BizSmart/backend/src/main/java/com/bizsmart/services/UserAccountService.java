package com.bizsmart.services;

import com.bizsmart.exceptions.ConflictException;
import com.bizsmart.exceptions.ResourceNotFoundException;
import com.bizsmart.models.ERole;
import com.bizsmart.models.Role;
import com.bizsmart.models.User;
import com.bizsmart.payload.request.SignupRequest;
import com.bizsmart.repositories.RoleRepository;
import com.bizsmart.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Single place for creating user accounts so owners and staff follow the same rules. */
@Service
public class UserAccountService {

    public static final Set<ERole> STAFF_ROLES = Set.of(ERole.ROLE_EMPLOYEE, ERole.ROLE_STAFF, ERole.ROLE_MANAGER);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAccountService(UserRepository userRepository, RoleRepository roleRepository,
                              PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User createUser(SignupRequest request, ERole roleName) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        String username = (request.getUsername() == null || request.getUsername().isBlank())
                ? email
                : request.getUsername().trim();

        if (Boolean.TRUE.equals(userRepository.existsByEmailIgnoreCase(email))) {
            throw new ConflictException("An account with this email already exists. Please sign in instead.");
        }
        if (Boolean.TRUE.equals(userRepository.existsByUsernameIgnoreCase(username))) {
            throw new ConflictException("This username is already taken.");
        }

        User user = new User(username, email, passwordEncoder.encode(request.getPassword()),
                request.getFullName() != null ? request.getFullName().trim() : null);
        user.setPhone(request.getPhone());
        user.setJobTitle(request.getJobTitle());
        if (request.getSalary() != null) {
            user.setSalary(request.getSalary());
        }
        user.setRoles(new HashSet<>(Set.of(findOrCreateRole(roleName))));
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<User> listStaff() {
        return userRepository.findByRoleNames(STAFF_ROLES);
    }

    @Transactional
    public User setActive(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        boolean isStaff = user.getRoles().stream().anyMatch(r -> STAFF_ROLES.contains(r.getName()));
        if (!isStaff) {
            throw new IllegalArgumentException("Only staff accounts can be activated or deactivated here.");
        }
        user.setActive(active);
        return userRepository.save(user);
    }

    private Role findOrCreateRole(ERole roleName) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(roleName)));
    }
}
