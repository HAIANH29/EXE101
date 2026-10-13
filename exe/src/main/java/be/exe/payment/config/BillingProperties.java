package be.exe.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;

@ConfigurationProperties(prefix = "app.billing")
public class BillingProperties {

    private BigDecimal bookingFee = new BigDecimal("5000");
    private BigDecimal salonProMonthlyFee = new BigDecimal("150000");

    public BigDecimal getBookingFee() {
        return bookingFee;
    }

    public void setBookingFee(BigDecimal bookingFee) {
        this.bookingFee = bookingFee;
    }

    public BigDecimal getSalonProMonthlyFee() {
        return salonProMonthlyFee;
    }

    public void setSalonProMonthlyFee(BigDecimal salonProMonthlyFee) {
        this.salonProMonthlyFee = salonProMonthlyFee;
    }
}
