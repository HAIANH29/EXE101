package be.exe.common.security;

import java.util.List;
import java.util.Optional;

/**
 * "Port" (Dependency Inversion) - common không được import thẳng User entity của module auth,
 * nên định nghĩa interface này ở đây. Module auth sẽ implement interface này
 * (ví dụ class UserAccountPortImpl trong be.exe.auth.service), Spring sẽ tự inject vào
 * CustomUserDetailsService bên dưới thông qua @Service + constructor injection.
 */
public interface UserAccountPort {

    /**
     * Tìm thông tin tài khoản theo email, dùng khi Spring Security load user lúc login.
     */
    Optional<AccountInfo> findByEmail(String email);

    Optional<PublicProfile> findPublicProfileById(Long userId);

    /**
     * Dữ liệu tối thiểu cần cho việc xác thực + phân quyền,
     * KHÔNG phải là toàn bộ User entity (tránh lộ field không cần thiết như password_hash ra ngoài).
     */
    record AccountInfo(
            Long id,
            String email,
            String passwordHash,
            boolean enabled,
            List<String> roles
    ) {
    }

    record PublicProfile(
            Long id,
            String email,
            String fullName,
            String phone,
            String avatarUrl
    ) {
    }
}
