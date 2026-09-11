package be.exe.salon.dto.request;

import jakarta.validation.constraints.NotNull;

public class UpdateSalonStatusRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private String status; // ACTIVE / INACTIVE / PENDING_APPROVAL

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
