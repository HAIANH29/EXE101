package be.exe.payment.sepay;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Payload SePay POST tới webhook khi phát hiện có giao dịch mới trên tài khoản ngân hàng.
 * "content" chính là nội dung chuyển khoản thực tế khách đã gõ - dùng để đối soát referenceCode.
 * "id" là mã giao dịch riêng của SePay - lưu vào Payment.transactionId để đối soát sau này.
 *
 * @JsonIgnoreProperties(ignoreUnknown = true): SePay có thể thêm field mới trong tương lai,
 * không muốn app crash vì field lạ không khai báo.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SepayWebhookRequest(
        @NotNull(message = "id giao dịch không được để trống") Long id,
        String gateway,
        String transactionDate,
        String accountNumber,
        @NotBlank(message = "content không được để trống") String content,
        @NotBlank(message = "transferType không được để trống") String transferType,
        @NotNull(message = "transferAmount không được để trống") BigDecimal transferAmount,
        BigDecimal accumulated
) {
    public boolean isIncoming() {
        return "in".equalsIgnoreCase(transferType);
    }
}
