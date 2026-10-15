package be.exe.salon.service.impl;

import be.exe.admin.service.impl.AdminServiceImpl;
import be.exe.auth.service.AuthService;
import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.payment.service.PaymentService;
import be.exe.salon.domain.Salon;
import be.exe.salon.domain.SalonStatus;
import be.exe.salon.dto.request.CreateSalonRequest;
import be.exe.salon.dto.response.SalonResponse;
import be.exe.salon.repository.SalonBusinessHourRepository;
import be.exe.salon.repository.SalonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SalonApprovalFlowTest {

    @Mock
    private SalonRepository salonRepository;

    @Mock
    private SalonBusinessHourRepository businessHourRepository;

    @Mock
    private AuthService authService;

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private SalonServiceImpl salonService;

    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminServiceImpl(authService, salonService, paymentService);
    }

    @Test
    void testCreateSalon_Success_WhenNoPendingSalonExists() {
        Long ownerId = 100L;
        CreateSalonRequest request = new CreateSalonRequest();
        request.setName("Barber Shop 1");
        request.setPhone("0987654321");
        request.setAddress("Hanoi");

        when(salonRepository.existsByOwnerIdAndStatus(ownerId, SalonStatus.PENDING_APPROVAL))
                .thenReturn(false);
        when(salonRepository.saveAndFlush(any(Salon.class))).thenAnswer(invocation -> {
            Salon s = invocation.getArgument(0);
            ReflectionTestUtils.setField(s, "id", 1L);
            return s;
        });

        SalonResponse response = salonService.createSalon(ownerId, request);

        assertNotNull(response);
        assertEquals("Barber Shop 1", response.name());
        assertEquals("PENDING_APPROVAL", response.status());
        verify(salonRepository, times(1)).existsByOwnerIdAndStatus(ownerId, SalonStatus.PENDING_APPROVAL);
        verify(salonRepository, times(1)).saveAndFlush(any(Salon.class));
    }

    @Test
    void testCreateSalon_ThrowsException_WhenPendingSalonAlreadyExists() {
        Long ownerId = 100L;
        CreateSalonRequest request = new CreateSalonRequest();
        request.setName("Barber Shop 2");

        when(salonRepository.existsByOwnerIdAndStatus(ownerId, SalonStatus.PENDING_APPROVAL))
                .thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                salonService.createSalon(ownerId, request)
        );

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("chờ duyệt"));
        verify(salonRepository, never()).saveAndFlush(any(Salon.class));
    }

    @Test
    void testAdminApproveSalon_Success_TransitionsToActive() {
        Long salonId = 10L;
        Long ownerId = 100L;
        Salon salon = new Salon(ownerId, "Pending Salon");
        ReflectionTestUtils.setField(salon, "id", salonId);
        ReflectionTestUtils.setField(salon, "status", SalonStatus.PENDING_APPROVAL);

        when(salonRepository.findByIdForUpdate(salonId)).thenReturn(Optional.of(salon));
        SalonResponse response = adminService.approveSalon(salonId);

        assertNotNull(response);
        assertEquals("ACTIVE", response.status());
        assertEquals(SalonStatus.ACTIVE, salon.getStatus());
        verify(salonRepository, times(1)).findByIdForUpdate(salonId);
    }

    @Test
    void testAdminApproveSalon_ThrowsException_WhenSalonNotPending() {
        Long salonId = 10L;
        Long ownerId = 100L;
        Salon salon = new Salon(ownerId, "Active Salon");
        ReflectionTestUtils.setField(salon, "id", salonId);
        ReflectionTestUtils.setField(salon, "status", SalonStatus.ACTIVE);

        when(salonRepository.findByIdForUpdate(salonId)).thenReturn(Optional.of(salon));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                adminService.approveSalon(salonId)
        );

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("PENDING_APPROVAL"));
    }

    @Test
    void testAdminRejectSalon_Success_TransitionsToInactiveWithoutPromotingRole() {
        Long salonId = 10L;
        Long ownerId = 100L;
        Salon salon = new Salon(ownerId, "Pending Salon");
        ReflectionTestUtils.setField(salon, "id", salonId);
        ReflectionTestUtils.setField(salon, "status", SalonStatus.PENDING_APPROVAL);

        when(salonRepository.findByIdForUpdate(salonId)).thenReturn(Optional.of(salon));

        SalonResponse response = adminService.rejectSalon(salonId);

        assertNotNull(response);
        assertEquals("INACTIVE", response.status());
        assertEquals(SalonStatus.INACTIVE, salon.getStatus());
        verify(salonRepository, times(1)).findByIdForUpdate(salonId);
    }
}
