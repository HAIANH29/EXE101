package be.exe.analytics.service;

import be.exe.analytics.dto.response.Outcome3ReportResponse;
import be.exe.analytics.dto.response.Outcome3ReportResponse.Fairness;
import be.exe.analytics.dto.response.Outcome3ReportResponse.Reviews;
import be.exe.analytics.dto.response.Outcome3ReportResponse.Summary;
import be.exe.analytics.dto.response.Outcome3ReportResponse.TransactionRow;
import be.exe.analytics.dto.response.Outcome3UtmAnalyticsResponse;
import be.exe.analytics.repository.Outcome3Repository;
import be.exe.common.exception.ValidationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class Outcome3Service {

    static final double MAX_SINGLE_USER_SHARE_PERCENT = 20.0;

    private final Outcome3Repository repository;
    private final long transactionThreshold;

    public Outcome3Service(Outcome3Repository repository,
                           @Value("${app.outcome3.transaction-threshold:0}") long transactionThreshold) {
        this.repository = repository;
        this.transactionThreshold = transactionThreshold;
    }

    public Outcome3ReportResponse getReport() {
        Outcome3Repository.Totals totals = repository.totals();
        Outcome3Repository.CustomerCounts counts = repository.customerCounts();
        long reviewedPaid = repository.reviewedPaidCustomers();
        BigDecimal net = totals.gross().subtract(totals.refunded());

        Summary summary = new Summary(
                totals.gross(), totals.refunded(), net,
                repository.countCustomers(), totals.transactions(), totals.paidCustomers(),
                repository.countReviews(),
                totals.transactions() == 0 ? BigDecimal.ZERO
                        : net.divide(BigDecimal.valueOf(totals.transactions()), 0, RoundingMode.HALF_UP),
                transactionThreshold,
                transactionThreshold > 0
                        ? Outcome3Repository.percent(totals.transactions(), transactionThreshold) : null);

        double topShare = Outcome3Repository.percent(counts.topCustomerTransactions(), totals.transactions());
        Fairness fairness = new Fairness(counts.topCustomerTransactions(), topShare,
                MAX_SINGLE_USER_SHARE_PERCENT, topShare <= MAX_SINGLE_USER_SHARE_PERCENT);

        Reviews reviews = new Reviews(
                reviewedPaid,
                Outcome3Repository.percent(reviewedPaid, totals.paidCustomers()),
                Math.round(repository.averageRating() * 100.0) / 100.0,
                counts.repeatCustomers(),
                Outcome3Repository.percent(counts.repeatCustomers(), totals.paidCustomers()));

        return new Outcome3ReportResponse(summary, fairness, reviews, repository.channels());
    }

    public List<TransactionRow> getTransactions(int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 500);
        return repository.transactions(safeSize, Math.max(page, 0) * safeSize);
    }

    public Outcome3UtmAnalyticsResponse getUtmAnalytics(LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalDate effectiveTo = to != null ? to : today;
        LocalDate effectiveFrom = from != null ? from : effectiveTo.minusDays(29);
        if (effectiveFrom.isAfter(effectiveTo)) {
            throw new ValidationException("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
        }
        if (ChronoUnit.DAYS.between(effectiveFrom, effectiveTo) > 365) {
            throw new ValidationException("Khoảng thời gian tối đa là 365 ngày");
        }
        return repository.utmAnalytics(effectiveFrom, effectiveTo);
    }
}
