package be.exe.auth.service.impl;

import be.exe.auth.domain.User;
import be.exe.auth.domain.VerificationToken;
import be.exe.auth.domain.VerificationTokenType;
import be.exe.auth.dto.request.SendOtpRequest;
import be.exe.auth.dto.request.VerifyOtpRequest;
import be.exe.auth.repository.UserRepository;
import be.exe.auth.repository.VerificationTokenRepository;
import be.exe.notification.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private VerificationTokenRepository tokenRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    void testSendRegisterOtp_Success() {
        SendOtpRequest request = new SendOtpRequest();
        request.setEmail("test@gmail.com");

        when(userRepository.existsByEmail("test@gmail.com")).thenReturn(false);
        when(tokenRepository.findTopByEmailAndTypeOrderByCreatedAtDesc("test@gmail.com", VerificationTokenType.REGISTER_OTP))
                .thenReturn(Optional.empty());
        when(tokenRepository.countByEmailAndTypeAndCreatedAtAfter(eq("test@gmail.com"), eq(VerificationTokenType.REGISTER_OTP), any()))
                .thenReturn(0L);
        when(tokenRepository.save(any(VerificationToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.sendRegisterOtp(request);

        verify(tokenRepository, times(1)).invalidateActiveTokens("test@gmail.com", VerificationTokenType.REGISTER_OTP);
        verify(tokenRepository, times(1)).save(any(VerificationToken.class));
        verify(emailService, times(1)).sendHtmlEmailAsync(eq("test@gmail.com"), anyString(), anyString(), anyString());
    }

    @Test
    void testVerifyRegisterOtp_Success() {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail("test@gmail.com");
        request.setOtp("123456");

        VerificationToken token = new VerificationToken();
        token.setEmail("test@gmail.com");
        token.setToken("123456");
        token.setType(VerificationTokenType.REGISTER_OTP);
        token.setExpiresAt(Instant.now().plusSeconds(300));
        token.setVerified(false);
        token.setUsed(false);
        token.setAttemptCount(0);

        when(tokenRepository.findTopByEmailAndTypeOrderByCreatedAtDesc("test@gmail.com", VerificationTokenType.REGISTER_OTP))
                .thenReturn(Optional.of(token));

        authService.verifyRegisterOtp(request);

        assertTrue(token.isVerified());
        verify(tokenRepository, times(1)).save(token);
    }
}
