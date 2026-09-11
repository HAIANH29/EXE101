package be.exe.auth.mapper;

import be.exe.auth.domain.Role;
import be.exe.auth.domain.User;
import be.exe.auth.dto.response.UserResponse;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getAvatarUrl(),
                user.getStatus().name(),
                user.getRoles().stream().map(Role::getName).map(Enum::name).toList(),
                user.getCreatedAt()
        );
    }
}
