package be.exe.common.audit;

import be.exe.common.security.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

@Component
public class AuditFilter extends OncePerRequestFilter {

    private final AuditLogService auditLogService;

    public AuditFilter(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = System.currentTimeMillis() - startTime;
            
            // Only log /api paths, ignore static assets/swagger if needed
            String path = request.getRequestURI();
            if (path.startsWith("/api/")) {
                Long actorUserId = null;
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
                    actorUserId = userDetails.getUserId();
                }

                AuditLog auditLog = new AuditLog(
                        actorUserId,
                        request.getMethod(),
                        path,
                        response.getStatus(),
                        durationMs,
                        Instant.now()
                );
                
                auditLogService.saveAuditLog(auditLog);
            }
        }
    }
}
