package be.exe.common.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Implement UserDetails của Spring Security, bọc quanh UserAccountPort.AccountInfo.
 * userId dùng để lấy lại trong Controller qua @AuthenticationPrincipal CustomUserDetails principal,
 * rồi gọi principal.getUserId().
 */
public class CustomUserDetails implements UserDetails {

    private final Long userId;
    private final String email;
    private final String passwordHash;
    private final boolean enabled;
    private final List<GrantedAuthority> authorities;

    public CustomUserDetails(UserAccountPort.AccountInfo accountInfo) {
        this.userId = accountInfo.id();
        this.email = accountInfo.email();
        this.passwordHash = accountInfo.passwordHash();
        this.enabled = accountInfo.enabled();
        this.authorities = accountInfo.roles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .map(GrantedAuthority.class::cast)
                .toList();
    }

    public Long getUserId() {
        return userId;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return enabled;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
