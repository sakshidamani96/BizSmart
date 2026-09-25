package com.bizsmart.repositories;

import com.bizsmart.models.ERole;
import com.bizsmart.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    /** Lets people sign in with either their username or their email address. */
    Optional<User> findFirstByUsernameIgnoreCaseOrEmailIgnoreCase(String username, String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    Boolean existsByUsernameIgnoreCase(String username);

    Boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE r.name IN :roles ORDER BY u.createdAt DESC")
    List<User> findByRoleNames(@Param("roles") Collection<ERole> roles);
}
