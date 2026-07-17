package com.foodhub.auth.repository;

import com.foodhub.auth.entity.Role;
import com.foodhub.auth.entity.Role.ERole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(ERole name);
}
