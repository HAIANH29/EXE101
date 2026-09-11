package be.exe.auth.service;

import be.exe.auth.domain.Role;
import be.exe.auth.domain.User;
import be.exe.auth.repository.UserRepository;
import be.exe.common.security.UserAccountPort;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Implement UserAccountPort (định nghĩa trong common.security) - đây chính là "adapter"
 * nối module auth (có domain User thật) với common (chỉ biết interface, không biết User là gì).
 * Nhờ vậy common không bao giờ phải import be.exe.auth.domain.User trực tiếp.
 */
@Service
public class UserAccountPortImpl implements UserAccountPort {

    private final UserRepository userRepository;

    public UserAccountPortImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Optional<AccountInfo> findByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(this::toAccountInfo);
    }

    private AccountInfo toAccountInfo(User user) {
        return new AccountInfo(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.isEnabled(),
                user.getRoles().stream().map(Role::getName).map(Enum::name).toList()
        );
    }
}
