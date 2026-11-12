package be.exe.analytics.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** Một lượt truy cập kèm tham số UTM (utm_source / utm_medium / utm_campaign...). */
@Entity
@Table(name = "traffic_visits")
public class TrafficVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", length = 64, nullable = false)
    private String sessionId;

    @Column(name = "utm_source", length = 100, nullable = false)
    private String utmSource;

    @Column(name = "utm_medium", length = 100, nullable = false)
    private String utmMedium;

    @Column(name = "utm_campaign", length = 150)
    private String utmCampaign;

    @Column(name = "utm_term", length = 150)
    private String utmTerm;

    @Column(name = "utm_content", length = 150)
    private String utmContent;

    @Column(name = "landing_path", length = 255)
    private String landingPath;

    @Column(name = "referrer", length = 500)
    private String referrer;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected TrafficVisit() {
    }

    public TrafficVisit(String sessionId, String utmSource, String utmMedium, String utmCampaign,
                        String utmTerm, String utmContent, String landingPath, String referrer) {
        this.sessionId = sessionId;
        this.utmSource = utmSource;
        this.utmMedium = utmMedium;
        this.utmCampaign = utmCampaign;
        this.utmTerm = utmTerm;
        this.utmContent = utmContent;
        this.landingPath = landingPath;
        this.referrer = referrer;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public String getUtmSource() {
        return utmSource;
    }

    public String getUtmMedium() {
        return utmMedium;
    }

    public String getUtmCampaign() {
        return utmCampaign;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
