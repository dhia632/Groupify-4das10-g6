package tn.groupify.analytics.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

/**
 * Mode local de développement : lit les en-têtes transmis par le frontend.
 * En production, remplacer ce mécanisme par la validation JWT Keycloak.
 * La Gateway doit être la seule entrée réseau vers ce service.
 */
@Component
public class LocalIdentityFilter extends OncePerRequestFilter {
    @Value("${groupify.security.local-headers:true}")
    private boolean localHeaders;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator") || path.equals("/error") || !localHeaders;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String userId = request.getHeader("X-User-Id");
        String roles = request.getHeader("X-User-Roles");
        if (userId == null || userId.isBlank() || roles == null || roles.isBlank()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Missing X-User-Id or X-User-Roles header\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
