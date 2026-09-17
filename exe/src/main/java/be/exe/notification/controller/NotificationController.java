package be.exe.notification.controller;

import be.exe.common.response.ApiResponse;
import be.exe.common.response.PageResponse;
import be.exe.common.security.CustomUserDetails;
import be.exe.common.util.PaginationUtils;
import be.exe.notification.dto.response.NotificationResponse;
import be.exe.notification.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        var pageable = PaginationUtils.of(page, size);
        var result = notificationService.getMyNotifications(principal.getUserId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> countUnread(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.countUnread(principal.getUserId())));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long notificationId) {
        notificationService.markAsRead(notificationId, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu đã đọc"));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails principal) {
        notificationService.markAllAsRead(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu tất cả đã đọc"));
    }
}
