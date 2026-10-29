package be.exe.payment.service.impl;

import be.exe.booking.service.BookingService;
import be.exe.common.exception.ForbiddenException;
import be.exe.payment.config.BillingProperties;
import be.exe.payment.domain.Payment;
import be.exe.payment.domain.PaymentType;
import be.exe.payment.repository.PaymentRepository;
import be.exe.payment.sepay.SePayQrGenerator;
import be.exe.salon.service.SalonService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private SePayQrGenerator qrGenerator;
    @Mock
    private BookingService bookingService;
    @Mock
    private ApplicationEventPublisher eventPublisher;
    @Mock
    private BillingProperties billingProperties;
    @Mock
    private SalonService salonService;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    @Test
    void getPaymentReturnsCompleteTransactionDetailForOwner() {
        Payment payment = payment(42L, 7L);
        when(paymentRepository.findById(42L)).thenReturn(Optional.of(payment));

        var response = paymentService.getPayment(42L, 7L);

        assertThat(response.id()).isEqualTo(42L);
        assertThat(response.bookingId()).isEqualTo(99L);
        assertThat(response.customerId()).isEqualTo(7L);
        assertThat(response.paymentType()).isEqualTo("BOOKING_CONNECTION");
        assertThat(response.provider()).isEqualTo("SEPAY");
        assertThat(response.referenceCode()).isEqualTo("DH99-ABCD");
        assertThat(response.amount()).isEqualByComparingTo("120000.00");
        assertThat(response.paymentUrl()).isEqualTo("https://stored.example/payment");
        assertThat(response.createdAt()).isEqualTo(Instant.parse("2026-10-28T10:15:30Z"));
    }

    @Test
    void getPaymentRejectsAnotherCustomer() {
        when(paymentRepository.findById(42L)).thenReturn(Optional.of(payment(42L, 7L)));

        assertThatThrownBy(() -> paymentService.getPayment(42L, 8L))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void adminDetailDoesNotApplyCustomerOwnershipCheck() {
        Payment payment = payment(42L, 7L);
        when(paymentRepository.findById(42L)).thenReturn(Optional.of(payment));
        assertThat(paymentService.getPaymentForAdmin(42L).customerId()).isEqualTo(7L);
    }

    @Test
    void getPaidUsersMapsDatabaseAggregateWithoutDependingOnTransactionPage() {
        var projection = mock(PaymentRepository.PaidUserProjection.class);
        var pageable = PageRequest.of(0, 10);
        var lastPaidAt = OffsetDateTime.parse("2026-10-29T10:15:00+07:00");
        when(projection.getCustomerId()).thenReturn(7L);
        when(projection.getFullName()).thenReturn("Nguyễn An");
        when(projection.getEmail()).thenReturn("an@example.com");
        when(projection.getPhone()).thenReturn("0901234567");
        when(projection.getPaidTransactionCount()).thenReturn(3L);
        when(projection.getTotalPaidAmount()).thenReturn(new BigDecimal("360000.00"));
        when(projection.getTotalRefundedAmount()).thenReturn(new BigDecimal("120000.00"));
        when(projection.getLastPaidAt()).thenReturn(lastPaidAt);
        when(projection.getLatestPaymentId()).thenReturn(42L);
        when(paymentRepository.findPaidUsers(pageable)).thenReturn(new PageImpl<>(java.util.List.of(projection), pageable, 1));

        var response = paymentService.getPaidUsers(pageable).getContent().get(0);

        assertThat(response.customerId()).isEqualTo(7L);
        assertThat(response.fullName()).isEqualTo("Nguyễn An");
        assertThat(response.paidTransactionCount()).isEqualTo(3L);
        assertThat(response.totalPaidAmount()).isEqualByComparingTo("360000.00");
        assertThat(response.totalRefundedAmount()).isEqualByComparingTo("120000.00");
        assertThat(response.lastPaidAt()).isEqualTo(lastPaidAt.toInstant());
        assertThat(response.latestPaymentId()).isEqualTo(42L);
    }

    private Payment payment(Long id, Long customerId) {
        Payment payment = new Payment(
                99L,
                customerId,
                3L,
                PaymentType.BOOKING_CONNECTION,
                new BigDecimal("100000.00"),
                new BigDecimal("20000.00"),
                new BigDecimal("120000.00"),
                "DH99-ABCD",
                "https://stored.example/payment"
        );
        ReflectionTestUtils.setField(payment, "id", id);
        ReflectionTestUtils.setField(payment, "createdAt", Instant.parse("2026-10-28T10:15:30Z"));
        return payment;
    }
}
