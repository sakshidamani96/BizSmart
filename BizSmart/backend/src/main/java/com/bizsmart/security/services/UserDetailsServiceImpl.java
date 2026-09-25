package com.bizsmart.security.services;

import com.bizsmart.models.User;
import com.bizsmart.repositories.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Accepts a username or an email address. The frontend signs users in by email,
     * while seeded/legacy accounts may use a short username.
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String login) throws UsernameNotFoundException {
        String value = login == null ? "" : login.trim();
        User user = userRepository.findFirstByUsernameIgnoreCaseOrEmailIgnoreCase(value, value)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + value));

        return UserDetailsImpl.build(user);
    }
}
