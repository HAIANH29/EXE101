package be.exe.auth.dto.response;

import java.time.Instant;
import java.util.List;

public class UserResponse {

    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private String status;
    private List<String> roles;
    private Instant createdAt;

    public UserResponse(Long id, String email, String fullName, String phone,
                         String avatarUrl, String status, List<String> roles, Instant createdAt) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.avatarUrl = avatarUrl;
        this.status = status;
        this.roles = roles;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getFullName() {
        return fullName;
    }

    public String getPhone() {
        return phone;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getStatus() {
        return status;
    }

    public List<String> getRoles() {
        return roles;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
