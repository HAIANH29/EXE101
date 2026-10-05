package be.exe.payment.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Admin xác nhận đã hoàn tiền thủ công (chuyển khoản ngược lại cho khách).
 * amount để trống = hoàn toàn bộ số tiền đã thanh toán.
 */
public class RefundPaymentRequest {

    @DecimalMin(value = "0.01", message = "Số tiền hoàn phải lớn hơn 0")
    private BigDecimal amount;

    @NotBlank(message = "Mã giao dịch hoàn tiền không được để trống")
    @Size(max = 255, message = "Mã giao dịch hoàn tiền tối đa 255 ký tự")
    private String refundReference;

    @Size(max = 2000, message = "Ghi chú tối đa 2000 ký tự")
    private String note;

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getRefundReference() {
        return refundReference;
    }

    public void setRefundReference(String refundReference) {
        this.refundReference = refundReference;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
