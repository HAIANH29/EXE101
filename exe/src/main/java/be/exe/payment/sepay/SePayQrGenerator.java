package be.exe.payment.sepay;

import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;

@Component
public class SePayQrGenerator {

    private static final String QR_BASE_URL = "https://qr.sepay.vn/img";
    private static final String TRANSFER_DESCRIPTION_PREFIX = "SEVQR";

    private final SePayProperties properties;

    public SePayQrGenerator(SePayProperties properties) {
        this.properties = properties;
    }

    public String buildQrUrl(BigDecimal amount, String referenceCode) {
        return UriComponentsBuilder.fromUriString(QR_BASE_URL)
                .queryParam("acc", properties.getAccountNumber())
                .queryParam("bank", properties.getBankCode())
                .queryParam("amount", amount.toBigInteger())
                .queryParam("des", TRANSFER_DESCRIPTION_PREFIX + " " + referenceCode)
                .toUriString();
    }
}