package com.foodhub.auth.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.foodhub.auth.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Getter
public class UserDetailsImpl implements UserDetails {

    private final Long id;
    private final String username;
    private final String email;
    private final String fullName;
    private final String phone;
    private final boolean active;

    @JsonIgnore
    private final String password;

    private final Collection<? extends GrantedAuthority> authorities;

    private UserDetailsImpl(User user, List<GrantedAuthority> authorities) {
        this.id          = user.getId();
        this.username    = user.getUsername();
        this.email       = user.getEmail();
        this.fullName    = user.getFullName();
        this.phone       = user.getPhone();
        this.password    = user.getPassword();
        this.active      = user.isActive();
        this.authorities = authorities;
    }

    public static UserDetailsImpl build(User user) {
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                .collect(Collectors.toList());
        return new UserDetailsImpl(user, authorities);
    }

    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return active; }
}
