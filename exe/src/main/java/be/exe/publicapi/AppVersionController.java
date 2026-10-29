package be.exe.publicapi;

import be.exe.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint công khai tối thiểu để xác nhận artifact/commit thực sự đang chạy trên Render.
 */
@RestController
@RequestMapping("/api/public")
public class AppVersionController {

    private final String gitCommit;

    public AppVersionController(
            @Value("${RENDER_GIT_COMMIT:${GIT_COMMIT:local}}") String gitCommit) {
        this.gitCommit = gitCommit;
    }

    @GetMapping("/version")
    public ResponseEntity<ApiResponse<VersionResponse>> version() {
        return ResponseEntity.ok(ApiResponse.success(new VersionResponse(gitCommit)));
    }

    public record VersionResponse(String gitCommit) {
    }
}
