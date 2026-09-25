package com.bizsmart.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class SignupRequest {
    /** Optional: defaults to the email address when omitted. */
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank
    @Size(max = 100)
    @Email
    private String email;

    @NotBlank
    @Size(min = 6, max = 40)
    private String password;

    @Size(max = 100)
    private String fullName;

    @Size(max = 30)
    private String phone;

    @Size(max = 80)
    private String jobTitle;

    /** Ignored by public signup (roles are assigned server-side); kept for backward compatibility. */
    private Set<String> roles;
}
