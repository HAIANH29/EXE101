package be.exe.notification.countdown;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageTypeSpecifier;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.metadata.IIOMetadata;
import javax.imageio.metadata.IIOMetadataNode;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;

/**
 * Vẽ ảnh GIF động đồng hồ đếm ngược HH : MM : SS để nhúng vào email.
 *
 * Email (Gmail...) chặn JavaScript/CSS động, nên cách duy nhất để có "đồng hồ chạy" là một ảnh GIF
 * do server vẽ lúc người dùng mở thư: {@value #FRAMES} khung, mỗi khung cách nhau 1 giây, chạy một
 * lần rồi dừng ở khung cuối. Chữ số vẽ bằng 7 đoạn (hình chữ nhật) nên không phụ thuộc font hệ thống.
 */
public final class CountdownGifRenderer {

    public static final int FRAMES = 60;
    public static final int MAX_DISPLAY_SECONDS = 99 * 3600 + 59 * 60 + 59;

    private static final int WIDTH = 420;
    private static final int HEIGHT = 92;
    private static final int DIGIT_W = 38;
    private static final int DIGIT_H = 64;
    private static final int THICK = 7;
    private static final int PAIR_PAD = 12;
    private static final int DIGIT_GAP = 8;
    private static final int COLON_W = 30;

    private static final Color BACKGROUND = new Color(0xF7, 0xEF, 0xE4);
    private static final Color TILE = new Color(0x6B, 0x42, 0x27);
    private static final Color LIT = new Color(0xFF, 0xF4, 0xE2);
    private static final Color UNLIT = new Color(0x84, 0x5A, 0x3D);
    private static final Color COLON = new Color(0x9A, 0x76, 0x52);

    // Các đoạn: a(trên) b(phải-trên) c(phải-dưới) d(dưới) e(trái-dưới) f(trái-trên) g(giữa)
    private static final boolean[][] SEGMENTS = {
            {true, true, true, true, true, true, false},     // 0
            {false, true, true, false, false, false, false}, // 1
            {true, true, false, true, true, false, true},    // 2
            {true, true, true, true, false, false, true},    // 3
            {false, true, true, false, false, true, true},   // 4
            {true, false, true, true, false, true, true},    // 5
            {true, false, true, true, true, true, true},     // 6
            {true, true, true, false, false, false, false},  // 7
            {true, true, true, true, true, true, true},      // 8
            {true, true, true, true, false, true, true}      // 9
    };

    private CountdownGifRenderer() {
    }

    /**
     * @param remainingSeconds số giây còn lại tại khung đầu tiên (âm/0 = đã đến giờ)
     */
    public static byte[] render(long remainingSeconds) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageWriter writer = ImageIO.getImageWritersByFormatName("gif").next();
            try (ImageOutputStream ios = ImageIO.createImageOutputStream(out)) {
                writer.setOutput(ios);
                writer.prepareWriteSequence(null);
                ImageWriteParam param = writer.getDefaultWriteParam();
                for (int i = 0; i < FRAMES; i++) {
                    long remaining = Math.max(0, remainingSeconds - i);
                    BufferedImage frame = drawFrame(remaining);
                    IIOMetadata meta = writer.getDefaultImageMetadata(
                            ImageTypeSpecifier.createFromRenderedImage(frame), param);
                    configureFrame(meta, 100);
                    writer.writeToSequence(new IIOImage(frame, null, meta), param);
                    if (remaining == 0) {
                        break; // đã về 0, không cần thêm khung
                    }
                }
                writer.endWriteSequence();
            } finally {
                writer.dispose();
            }
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static void configureFrame(IIOMetadata meta, int delayHundredths) throws IOException {
        String format = "javax_imageio_gif_image_1.0";
        IIOMetadataNode root = (IIOMetadataNode) meta.getAsTree(format);
        IIOMetadataNode gce;
        var nodes = root.getElementsByTagName("GraphicControlExtension");
        if (nodes.getLength() > 0) {
            gce = (IIOMetadataNode) nodes.item(0);
        } else {
            gce = new IIOMetadataNode("GraphicControlExtension");
            root.appendChild(gce);
        }
        gce.setAttribute("disposalMethod", "none");
        gce.setAttribute("userInputFlag", "FALSE");
        gce.setAttribute("transparentColorFlag", "FALSE");
        gce.setAttribute("delayTime", String.valueOf(delayHundredths));
        gce.setAttribute("transparentColorIndex", "0");
        meta.setFromTree(format, root);
    }

    static BufferedImage drawFrame(long remainingSeconds) {
        long total = Math.min(Math.max(remainingSeconds, 0), MAX_DISPLAY_SECONDS);
        int hours = (int) (total / 3600);
        int minutes = (int) ((total % 3600) / 60);
        int seconds = (int) (total % 60);

        BufferedImage img = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setColor(BACKGROUND);
            g.fillRect(0, 0, WIDTH, HEIGHT);

            int pairW = 2 * DIGIT_W + DIGIT_GAP + 2 * PAIR_PAD;
            int totalW = 3 * pairW + 2 * COLON_W;
            int x = (WIDTH - totalW) / 2;
            int tileH = DIGIT_H + 20;
            int tileY = (HEIGHT - tileH) / 2;

            int[] values = {hours, minutes, seconds};
            for (int p = 0; p < 3; p++) {
                g.setColor(TILE);
                g.fillRoundRect(x, tileY, pairW, tileH, 18, 18);
                drawDigit(g, values[p] / 10, x + PAIR_PAD, tileY + 10);
                drawDigit(g, values[p] % 10, x + PAIR_PAD + DIGIT_W + DIGIT_GAP, tileY + 10);
                x += pairW;
                if (p < 2) {
                    g.setColor(COLON);
                    int cx = x + COLON_W / 2 - 3;
                    g.fillOval(cx, tileY + tileH / 2 - 16, 7, 7);
                    g.fillOval(cx, tileY + tileH / 2 + 9, 7, 7);
                    x += COLON_W;
                }
            }
        } finally {
            g.dispose();
        }
        return img;
    }

    private static void drawDigit(Graphics2D g, int digit, int x, int y) {
        int t = THICK;
        int v = (DIGIT_H - 3 * t) / 2;
        int hw = DIGIT_W - 2 * t - 2;
        boolean[] on = SEGMENTS[digit];
        int[][] rects = {
                {x + t + 1, y, hw, t},                          // a
                {x + DIGIT_W - t, y + t, t, v},                 // b
                {x + DIGIT_W - t, y + 2 * t + v, t, v},         // c
                {x + t + 1, y + DIGIT_H - t, hw, t},            // d
                {x, y + 2 * t + v, t, v},                       // e
                {x, y + t, t, v},                               // f
                {x + t + 1, y + t + v, hw, t}                   // g
        };
        for (int i = 0; i < 7; i++) {
            g.setColor(on[i] ? LIT : UNLIT);
            g.fillRoundRect(rects[i][0], rects[i][1], rects[i][2], rects[i][3], 4, 4);
        }
    }
}
