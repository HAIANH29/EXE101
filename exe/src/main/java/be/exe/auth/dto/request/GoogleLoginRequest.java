package be.exe.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequest {

    @NotBlank(message = "idToken không được để trống")
    private String idToken;

    /** Phiên truy cập (tuỳ chọn), chỉ dùng khi Google đăng nhập tạo ra user mới. */
    @jakarta.validation.constraints.Size(max = 64)
    private String signupSessionId;

    public String getSignupSessionId() {
        return signupSessionId;
    }

    public void setSignupSessionId(String signupSessionId) {
        this.signupSessionId = signupSessionId;
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }
}
