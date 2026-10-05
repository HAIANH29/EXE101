package be.exe.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record RefundPaymentRequest(
        @NotNull(message = "Số tiền hoàn không được để trống")
        @Positive(message = "Số tiền hoàn phải lớn hơn 0")
        BigDecimal refundAmount,

        @NotBlank(message = "Mã giao dịch hoàn tiền không được để trống")
        String refundReference,

        String note
) {
}
