package be.exe.notification;

import be.exe.notification.countdown.CountdownGifRenderer;
import be.exe.notification.mail.BookingEmailTemplates;
import be.exe.notification.mail.BookingEmailTemplates.BookingInfo;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CountdownAndEmailTemplateTest {

    private static int frameCount(byte[] gif) throws Exception {
        try (ImageInputStream in = ImageIO.createImageInputStream(new ByteArrayInputStream(gif))) {
            ImageReader reader = ImageIO.getImageReadersByFormatName("gif").next();
            reader.setInput(in);
            int n = reader.getNumImages(true);
            reader.dispose();
            return n;
        }
    }

    @Test
    void rendersAnAnimatedGifWithOneFramePerSecond() throws Exception {
        byte[] gif = CountdownGifRenderer.render(3 * 3600 + 25 * 60 + 9);

        assertEquals("GIF8", new String(gif, 0, 4, StandardCharsets.US_ASCII));
        assertEquals(CountdownGifRenderer.FRAMES, frameCount(gif));

        String out = System.getProperty("countdown.preview");
        if (out != null) {
            Files.write(Path.of(out), gif);
        }
    }

    @Test
    void stopsAtZeroWhenTheAppointmentIsAboutToStart() throws Exception {
        assertEquals(4, frameCount(CountdownGifRenderer.render(3))); // 3, 2, 1, 0
        assertEquals(1, frameCount(CountdownGifRenderer.render(-100)));
    }

    @Test
    void reminderEmailContainsTimeCountdownAndEscapesUserData() {
        Instant start = Instant.parse("2026-11-12T08:30:00Z"); // 15:30 giờ VN
        BookingInfo info = new BookingInfo("<b>An</b>", "Salon A", "1 Lê Lợi", "Cắt tóc", "Minh", start);

        String html = BookingEmailTemplates.reminder1h(info, "https://api.example.com/c.gif?to=1");

        assertTrue(html.contains("15:30"));
        assertTrue(html.contains("https://api.example.com/c.gif?to=1"));
        assertTrue(html.contains("cid:stylelock-logo"));
        assertTrue(html.contains("Salon A"));
        assertTrue(html.contains("&lt;b&gt;An&lt;/b&gt;"));
        assertTrue(!html.contains("<b>An</b>"));
    }
}
