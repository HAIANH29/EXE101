package be.exe.notification.push;

import be.exe.common.response.ApiResponse;
import be.exe.common.security.CustomUserDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Đăng ký / hủy token thiết bị để nhận thông báo đẩy. Cần đăng nhập. */
@RestController
@RequestMapping("/api/notifications/push-token")
public class PushTokenController {

    public record PushTokenRequest(
            @NotBlank @Size(max = 255) String token,
            @Size(max = 20) String platform) {
    }

    private final PushNotificationService pushService;

    public PushTokenController(PushNotificationService pushService) {
        this.pushService = pushService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> register(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody PushTokenRequest request) {
        pushService.register(principal.getUserId(), request.token(), request.platform());
        return ResponseEntity.ok(ApiResponse.success("Đã đăng ký nhận thông báo đẩy"));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> unregister(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody PushTokenRequest request) {
        pushService.unregister(principal.getUserId(), request.token());
        return ResponseEntity.ok(ApiResponse.success("Đã tắt thông báo đẩy cho thiết bị này"));
    }
}
