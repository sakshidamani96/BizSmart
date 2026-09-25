package com.bizsmart.controllers;

import com.bizsmart.models.ERole;
import com.bizsmart.payload.request.LoginRequest;
import com.bizsmart.payload.request.SignupRequest;
import com.bizsmart.payload.response.JwtResponse;
import com.bizsmart.payload.response.MessageResponse;
import com.bizsmart.security.jwt.JwtUtils;
import com.bizsmart.security.services.UserDetailsImpl;
import com.bizsmart.services.UserAccountService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserAccountService userAccountService;
    private final JwtUtils jwtUtils;

    @Value("${bizsmart.app.public-signup-enabled:true}")
    private boolean publicSignupEnabled;

    public AuthController(AuthenticationManager authenticationManager,
                          UserAccountService userAccountService,
                          JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userAccountService = userAccountService;
        this.jwtUtils = jwtUtils;
    }

    /** Sign in with username OR email. Bad credentials are mapped to 401 by GlobalExceptionHandler. */
    @PostMapping("/signin")
    public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername().trim(), loginRequest.getPassword()));

        return ResponseEntity.ok(toJwtResponse(authentication));
    }

    /**
     * Public registration creates a Store Owner account only. Staff accounts are created by an
     * owner through /api/employees, so nobody can self-assign an elevated role.
     */
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (!publicSignupEnabled) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Public registration is disabled on this server."));
        }
        userAccountService.createUser(signUpRequest, ERole.ROLE_BUSINESS_OWNER);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MessageResponse("Store owner account registered successfully."));
    }

    /** Returns the currently authenticated user (useful for restoring a session after page reload). */
    @GetMapping("/me")
    public ResponseEntity<?> currentUser(@AuthenticationPrincipal UserDetailsImpl user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Not signed in."));
        }
        List<String> roles = user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
        return ResponseEntity.ok(new JwtResponse(null, user.getId(), user.getUsername(),
                user.getEmail(), user.getFullName(), roles));
    }

    private JwtResponse toJwtResponse(Authentication authentication) {
        String jwt = jwtUtils.generateJwtToken(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                userDetails.getFullName(),
                roles);
    }
}
