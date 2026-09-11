package be.exe.common.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Cầu nối giữa Spring Security và dữ liệu user thật (nằm ở module auth).
 * Không phụ thuộc trực tiếp vào auth.domain.User - chỉ gọi qua UserAccountPort.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserAccountPort userAccountPort;

    public CustomUserDetailsService(UserAccountPort userAccountPort) {
        this.userAccountPort = userAccountPort;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserAccountPort.AccountInfo accountInfo = userAccountPort.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user với email: " + email));

        return new CustomUserDetails(accountInfo);
    }
}
