package be.exe.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UpdateUserStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(regexp = "ACTIVE|INACTIVE|BANNED",
            message = "Trạng thái chỉ được là ACTIVE, INACTIVE hoặc BANNED")
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
