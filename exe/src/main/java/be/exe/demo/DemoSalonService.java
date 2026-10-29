package be.exe.demo;

import be.exe.auth.domain.Role;
import be.exe.auth.domain.RoleName;
import be.exe.auth.domain.User;
import be.exe.auth.repository.RoleRepository;
import be.exe.auth.repository.UserRepository;
import be.exe.catalog.domain.ServiceOffering;
import be.exe.catalog.repository.ServiceOfferingRepository;
import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.demo.dto.MaterializeDemoSalonRequest;
import be.exe.salon.domain.Salon;
import be.exe.salon.domain.SalonBusinessHour;
import be.exe.salon.domain.SalonStatus;
import be.exe.salon.domain.Stylist;
import be.exe.salon.dto.response.SalonResponse;
import be.exe.salon.mapper.SalonMapper;
import be.exe.salon.repository.SalonBusinessHourRepository;
import be.exe.salon.repository.SalonRepository;
import be.exe.salon.repository.StylistRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalTime;

@Service
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true")
@Transactional
public class DemoSalonService {

    private final SalonRepository salonRepository;
    private final ServiceOfferingRepository serviceRepository;
    private final StylistRepository stylistRepository;
    private final SalonBusinessHourRepository businessHourRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final String ownerEmail;
    private final String ownerPassword;

    public DemoSalonService(
            SalonRepository salonRepository,
            ServiceOfferingRepository serviceRepository,
            StylistRepository stylistRepository,
            SalonBusinessHourRepository businessHourRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.demo.owner-email:demo.owner@stylelock.local}") String ownerEmail,
            @Value("${app.demo.owner-password:DemoOwner123!}") String ownerPassword) {
        this.salonRepository = salonRepository;
        this.serviceRepository = serviceRepository;
        this.stylistRepository = stylistRepository;
        this.businessHourRepository = businessHourRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.ownerEmail = ownerEmail;
        this.ownerPassword = ownerPassword;
    }

    public synchronized SalonResponse materialize(MaterializeDemoSalonRequest request) {
        String placeId = request.placeId().trim();
        Salon salon = salonRepository.findByGeoapifyPlaceId(placeId).orElse(null);
        if (salon != null) {
            if (!salon.isDemo()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "Địa điểm này đã được một Salon Owner liên kết; không thể chuyển thành salon demo");
            }
            salon.changeStatus(SalonStatus.ACTIVE);
            ensureDemoCatalog(salon);
            return SalonMapper.toResponse(salon);
        }

        User owner = getOrCreateDemoOwner();
        salon = new Salon(owner.getId(), request.name().trim());
        salon.updateInfo(request.name().trim(), request.phone(), request.address(),
                "Dữ liệu demo StyleLock từ địa điểm Geoapify. Không đại diện cho chủ salon ngoài đời.", null);
        salon.linkGeoapifyLocation(placeId, request.latitude(), request.longitude());
        salon.markDemo();
        salon.changeStatus(SalonStatus.ACTIVE);
        salon = salonRepository.saveAndFlush(salon);
        ensureDemoCatalog(salon);
        return SalonMapper.toResponse(salon);
    }

    private User getOrCreateDemoOwner() {
        Role role = getOrCreateRole(RoleName.SALON_OWNER);
        User owner = userRepository.findByEmail(ownerEmail).orElseGet(() -> {
            User created = new User(ownerEmail, passwordEncoder.encode(ownerPassword),
                    "StyleLock Demo Owner");
            created.addRole(role);
            return userRepository.saveAndFlush(created);
        });
        if (owner.getRoles().stream().noneMatch(item -> item.getName() == RoleName.SALON_OWNER)) {
            owner.addRole(role);
        }
        return owner;
    }

    private Role getOrCreateRole(RoleName roleName) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.saveAndFlush(new Role(roleName)));
    }

    private void ensureDemoCatalog(Salon salon) {
        if (!serviceRepository.existsBySalonId(salon.getId())) {
            serviceRepository.save(new ServiceOffering(salon.getId(), "Cắt tóc demo", new BigDecimal("120000"), 45));
            serviceRepository.save(new ServiceOffering(salon.getId(), "Gội & tạo kiểu demo", new BigDecimal("80000"), 30));
            serviceRepository.save(new ServiceOffering(salon.getId(), "Nhuộm tóc demo", new BigDecimal("250000"), 90));
        }

        if (!stylistRepository.existsBySalonId(salon.getId())) {
            Role staffRole = getOrCreateRole(RoleName.STAFF);
            String staffEmail = "demo.stylist.s" + salon.getId() + "@stylelock.local";
            User staff = userRepository.findByEmail(staffEmail).orElseGet(() -> {
                User created = new User(staffEmail, passwordEncoder.encode(ownerPassword),
                        "Stylist Demo " + salon.getId());
                created.addRole(staffRole);
                return userRepository.saveAndFlush(created);
            });
            Stylist stylist = new Stylist(staff.getId(), salon.getId());
            stylist.updateInfo("Stylist dữ liệu thử nghiệm do nhóm StyleLock quản lý", 5);
            stylistRepository.save(stylist);
        }

        if (!businessHourRepository.existsBySalonId(salon.getId())) {
            for (short day = 1; day <= 7; day++) {
                businessHourRepository.save(new SalonBusinessHour(
                        salon.getId(), day, LocalTime.of(9, 0), LocalTime.of(20, 0), false));
            }
        }
    }
}
