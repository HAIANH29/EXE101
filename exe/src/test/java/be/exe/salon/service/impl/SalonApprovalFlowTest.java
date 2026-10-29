package be.exe.salon.service.impl;

import be.exe.admin.service.impl.AdminServiceImpl;
import be.exe.auth.service.AuthService;
import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.payment.service.PaymentService;
import be.exe.salon.domain.Salon;
import be.exe.salon.domain.SalonStatus;
import be.exe.salon.dto.request.CreateSalonRequest;
import be.exe.salon.dto.request.UpdateSalonRequest;
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
import java.time.LocalTime;

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
    private be.exe.salon.repository.StylistRepository stylistRepository;

    @Mock
    private be.exe.salon.repository.SalonImageRepository salonImageRepository;

    @Mock
    private be.exe.common.storage.StorageService storageService;

    @Mock
    private AuthService authService;

    @Mock
    private PaymentService paymentService;

    @Mock
    private be.exe.catalog.service.ServiceCatalogService serviceCatalogService;

    @InjectMocks
    private SalonServiceImpl salonService;

    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminServiceImpl(authService, salonService, paymentService,
                serviceCatalogService);
    }

    @Test
    void testCreateSalon_Success_WhenNoPendingSalonExists() {
        Long ownerId = 100L;
        CreateSalonRequest request = new CreateSalonRequest();
        request.setName("Barber Shop 1");
        request.setPhone("0987654321");
        request.setAddress("Hanoi");
        request.setGeoapifyPlaceId("geo-create-1");
        request.setLatitude(21.0285);
        request.setLongitude(105.8542);

        when(salonRepository.existsByOwnerIdAndStatus(ownerId, SalonStatus.PENDING_APPROVAL))
                .thenReturn(false);
        when(geoapifySalonService.validateSalonPlace("geo-create-1", 21.0285, 105.8542))
                .thenReturn(new be.exe.publicapi.GeoapifySalonService.ValidatedSalonPlace(
                        "geo-create-canonical", "Barber Shop 1", "Hanoi",
                        21.0285, 105.8542));
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
        salon.linkGeoapifyLocation("geo-approved-10", 10.8505, 106.7585);
        salon.markLocationVerified();

        when(serviceCatalogService.hasActiveServices(salonId)).thenReturn(true);
        when(salonRepository.findByIdForUpdate(salonId)).thenReturn(Optional.of(salon));
        when(stylistRepository.countBySalonIdAndStatus(
                salonId, be.exe.salon.domain.StylistStatus.ACTIVE)).thenReturn(1L);
        when(businessHourRepository.findBySalonIdOrderByDayOfWeek(salonId)).thenReturn(
                java.util.stream.IntStream.rangeClosed(1, 7)
                        .mapToObj(day -> new be.exe.salon.domain.SalonBusinessHour(
                                salonId, (short) day, LocalTime.of(9, 0), LocalTime.of(18, 0), false))
                        .toList());
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

        when(serviceCatalogService.hasActiveServices(salonId)).thenReturn(true);
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

    @Test
    void ownerLinkingNewGeoapifyPlaceRequiresAdminApprovalAgain() {
        Long salonId = 20L;
        Long ownerId = 100L;
        Salon salon = new Salon(ownerId, "Approved Salon");
        ReflectionTestUtils.setField(salon, "id", salonId);
        salon.changeStatus(SalonStatus.ACTIVE);

        UpdateSalonRequest request = new UpdateSalonRequest();
        request.setName("Approved Salon");
        request.setGeoapifyPlaceId("geo-place-20");
        request.setLatitude(10.7769);
        request.setLongitude(106.7009);

        when(salonRepository.findById(salonId)).thenReturn(Optional.of(salon));
        when(salonRepository.existsByGeoapifyPlaceIdAndIdNot("geo-place-20", salonId))
                .thenReturn(false);

        SalonResponse response = salonService.updateSalon(salonId, ownerId, request);

        assertEquals("geo-place-20", response.geoapifyPlaceId());
        assertEquals("PENDING_APPROVAL", response.status());
    }
}
