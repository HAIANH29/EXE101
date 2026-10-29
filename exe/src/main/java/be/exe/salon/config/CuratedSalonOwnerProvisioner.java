package be.exe.salon.config;

import be.exe.auth.domain.Role;
import be.exe.auth.domain.RoleName;
import be.exe.auth.domain.User;
import be.exe.auth.domain.UserStatus;
import be.exe.auth.repository.RoleRepository;
import be.exe.auth.repository.UserRepository;
import be.exe.salon.repository.SalonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * Enables the team account for curated salon listings only when deployment
 * credentials are supplied. The migration creates an inactive system owner,
 * so no production password is committed to source control.
 */
@Component
public class CuratedSalonOwnerProvisioner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CuratedSalonOwnerProvisioner.class);
    private static final String SYSTEM_OWNER_EMAIL = "platform.salons@stylelock.internal";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SalonRepository salonRepository;
    private final PasswordEncoder passwordEncoder;
    private final String configuredEmail;
    private final String configuredPassword;

    public CuratedSalonOwnerProvisioner(
            UserRepository userRepository,
            RoleRepository roleRepository,
            SalonRepository salonRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.curated-owner.email:}") String configuredEmail,
            @Value("${app.curated-owner.password:}") String configuredPassword) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.salonRepository = salonRepository;
        this.passwordEncoder = passwordEncoder;
        this.configuredEmail = configuredEmail;
        this.configuredPassword = configuredPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (configuredEmail == null || configuredEmail.isBlank()
                || configuredPassword == null || configuredPassword.isBlank()) {
            salonRepository.findFirstByPlatformManagedTrue()
                    .flatMap(salon -> userRepository.findById(salon.getOwnerId()))
                    .ifPresent(owner -> owner.setStatus(UserStatus.INACTIVE));
            log.info("Curated salon owner login is disabled; configure both "
                    + "STYLELOCK_CURATED_OWNER_EMAIL and STYLELOCK_CURATED_OWNER_PASSWORD to enable it");
            return;
        }

        String targetEmail = configuredEmail.trim().toLowerCase(Locale.ROOT);
        User systemOwner = userRepository.findByEmail(SYSTEM_OWNER_EMAIL).orElse(null);
        User owner = userRepository.findByEmail(targetEmail).orElse(null);

        if (owner == null && systemOwner != null) {
            systemOwner.changeEmail(targetEmail);
            owner = systemOwner;
        } else if (owner == null) {
            owner = new User(targetEmail, passwordEncoder.encode(configuredPassword),
                    "StyleLock Curated Salon Team");
        }

        owner.changePassword(passwordEncoder.encode(configuredPassword));
        owner.setStatus(UserStatus.ACTIVE);
        Role ownerRole = roleRepository.findByName(RoleName.SALON_OWNER)
                .orElseGet(() -> roleRepository.saveAndFlush(new Role(RoleName.SALON_OWNER)));
        if (owner.getRoles().stream().noneMatch(role -> role.getName() == RoleName.SALON_OWNER)) {
            owner.addRole(ownerRole);
        }

        owner = userRepository.saveAndFlush(owner);
        salonRepository.reassignPlatformManagedOwner(owner.getId());
        log.info("Curated salon owner login enabled for configured team account");
    }
}
