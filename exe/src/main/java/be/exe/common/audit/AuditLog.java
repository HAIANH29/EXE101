package be.exe.common.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_user_id")
    private Long actorUserId;

    @Column(nullable = false, length = 10)
    private String method;

    @Column(nullable = false, length = 512)
    private String path;

    @Column(name = "status_code", nullable = false)
    private int statusCode;

    @Column(name = "duration_ms", nullable = false)
    private long durationMs;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AuditLog() {
    }

    public AuditLog(Long actorUserId, String method, String path,
                    int statusCode, long durationMs, Instant createdAt) {
        this.actorUserId = actorUserId;
        this.method = method;
        this.path = path;
        this.statusCode = statusCode;
        this.durationMs = durationMs;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getActorUserId() { return actorUserId; }
    public String getMethod() { return method; }
    public String getPath() { return path; }
    public int getStatusCode() { return statusCode; }
    public long getDurationMs() { return durationMs; }
    public Instant getCreatedAt() { return createdAt; }
}
