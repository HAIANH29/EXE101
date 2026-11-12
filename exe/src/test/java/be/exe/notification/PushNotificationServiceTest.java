package be.exe.notification;

import be.exe.common.exception.ValidationException;
import be.exe.notification.push.DevicePushTokenRepository;
import be.exe.notification.push.ExpoPushClient;
import be.exe.notification.push.PushNotificationService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
class PushNotificationServiceTest {

    private static final String TOKEN_A = "ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]";
    private static final String TOKEN_B = "ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]";

    @Autowired
    private PushNotificationService pushService;
    @Autowired
    private DevicePushTokenRepository repository;
    @MockBean
    private ExpoPushClient client;

    @Test
    void rejectsTokensThatAreNotExpoTokens() {
        assertThrows(ValidationException.class, () -> pushService.register(9301L, "not-a-token", "android"));
        assertThrows(ValidationException.class, () -> pushService.register(9301L, null, "android"));
    }

    @Test
    void registeringTheSameTokenMovesItToTheNewUser() {
        pushService.register(9302L, TOKEN_A, "android");
        pushService.register(9303L, TOKEN_A, "android");

        assertTrue(repository.findByUserId(9302L).isEmpty());
        assertEquals(1, repository.findByUserId(9303L).size());

        pushService.unregister(9302L, TOKEN_A);               // không phải chủ token -> không xóa
        assertEquals(1, repository.findByUserId(9303L).size());
        pushService.unregister(9303L, TOKEN_A);
        assertTrue(repository.findByUserId(9303L).isEmpty());
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendsToEveryDeviceOfTheUserAndDropsDeadTokens() {
        pushService.register(9304L, TOKEN_A, "android");
        pushService.register(9304L, TOKEN_B, "ios");
        when(client.send(anyList())).thenReturn(List.of(TOKEN_B));

        pushService.sendToUser(9304L, "Tiêu đề", "Nội dung", Map.of("type", "BOOKING_REMINDER"));

        ArgumentCaptor<List<ExpoPushClient.Message>> captor = ArgumentCaptor.forClass(List.class);
        verify(client, timeout(5000)).send(captor.capture());
        List<ExpoPushClient.Message> sent = captor.getValue();
        assertEquals(2, sent.size());
        assertTrue(sent.stream().allMatch(m -> m.title().equals("Tiêu đề") && m.body().equals("Nội dung")));

        // token Expo báo hết hiệu lực bị xóa (chạy bất đồng bộ nên chờ một chút)
        long deadline = System.currentTimeMillis() + 5000;
        while (repository.findByToken(TOKEN_B).isPresent() && System.currentTimeMillis() < deadline) {
            Thread.onSpinWait();
        }
        assertTrue(repository.findByToken(TOKEN_B).isEmpty());
        assertTrue(repository.findByToken(TOKEN_A).isPresent());

        repository.deleteByTokens(List.of(TOKEN_A));
    }
}
