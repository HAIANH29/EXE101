package be.exe.salon.config;

import be.exe.auth.domain.Role;
import be.exe.auth.domain.RoleName;
import be.exe.auth.domain.User;
import be.exe.auth.domain.UserStatus;
import be.exe.auth.repository.RoleRepository;
import be.exe.auth.repository.UserRepository;
import be.exe.salon.domain.Salon;
import be.exe.salon.repository.SalonRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CuratedSalonOwnerProvisionerTest {

    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock SalonRepository salonRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock ApplicationArguments arguments;

    @Test
    void missingCredentialsKeepsCurrentCuratedOwnerInactive() {
        User owner = new User("platform.salons@stylelock.internal", "disabled", "Platform");
        ReflectionTestUtils.setField(owner, "id", 7L);
        Salon salon = new Salon(7L, "Curated Salon");
        when(salonRepository.findFirstByPlatformManagedTrue()).thenReturn(Optional.of(salon));
        when(userRepository.findById(7L)).thenReturn(Optional.of(owner));

        var provisioner = new CuratedSalonOwnerProvisioner(
                userRepository, roleRepository, salonRepository, passwordEncoder, "", "");
        provisioner.run(arguments);

        assertThat(owner.getStatus()).isEqualTo(UserStatus.INACTIVE);
    }

    @Test
    void configuredCredentialsActivateTeamOwnerAndAssignCuratedSalons() {
        User systemOwner = new User(
                "platform.salons@stylelock.internal", "disabled", "Platform");
        ReflectionTestUtils.setField(systemOwner, "id", 9L);
        Role ownerRole = new Role(RoleName.SALON_OWNER);

        when(userRepository.findByEmail("platform.salons@stylelock.internal"))
                .thenReturn(Optional.of(systemOwner));
        when(userRepository.findByEmail("team.owner@stylelock.test"))
                .thenReturn(Optional.empty());
        when(passwordEncoder.encode("strong-password")).thenReturn("bcrypt-hash");
        when(roleRepository.findByName(RoleName.SALON_OWNER)).thenReturn(Optional.of(ownerRole));
        when(userRepository.saveAndFlush(systemOwner)).thenReturn(systemOwner);

        var provisioner = new CuratedSalonOwnerProvisioner(
                userRepository, roleRepository, salonRepository, passwordEncoder,
                "TEAM.OWNER@STYLELOCK.TEST", "strong-password");
        provisioner.run(arguments);

        assertThat(systemOwner.getEmail()).isEqualTo("team.owner@stylelock.test");
        assertThat(systemOwner.getPasswordHash()).isEqualTo("bcrypt-hash");
        assertThat(systemOwner.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(systemOwner.getRoles()).extracting(Role::getName)
                .contains(RoleName.SALON_OWNER);
        verify(salonRepository).reassignPlatformManagedOwner(9L);
    }
}
