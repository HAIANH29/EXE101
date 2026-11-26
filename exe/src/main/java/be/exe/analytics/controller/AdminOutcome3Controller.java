package be.exe.analytics.controller;

import be.exe.analytics.dto.response.Outcome3ReportResponse;
import be.exe.analytics.dto.response.Outcome3ReportResponse.TransactionRow;
import be.exe.analytics.dto.response.Outcome3UtmAnalyticsResponse;
import be.exe.analytics.service.Outcome3Service;
import be.exe.common.response.ApiResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** Dashboard Outcome 3: chỉ số tổng hợp + danh sách giao dịch để đối soát. */
@RestController
@RequestMapping("/api/admin/analytics/outcome3")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOutcome3Controller {

    private final Outcome3Service service;

    public AdminOutcome3Controller(Outcome3Service service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Outcome3ReportResponse>> getReport() {
        return ResponseEntity.ok(ApiResponse.success(service.getReport()));
    }

    /** Mỗi giao dịch: mã đơn, phương thức, mã tham chiếu, mã SePay, số tiền, trạng thái, thời điểm. */
    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<TransactionRow>>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.getTransactions(page, size)));
    }

    /** G3.3: Phân tích lưu lượng truy cập theo ngày và hiệu quả 3 kênh UTM chính trong khoảng ngày. */
    @GetMapping("/utm")
    public ResponseEntity<ApiResponse<Outcome3UtmAnalyticsResponse>> getUtmAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(service.getUtmAnalytics(from, to)));
    }
}
