package tn.esprit.gamification.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * PROFIL "local" UNIQUEMENT – démo sans Keycloak.
 * Chaque requête est authentifiée avec un utilisateur fictif construit à partir d'en-têtes facultatifs :
 *   X-User-Id    (défaut : student1)
 *   X-User-Name  (défaut : la valeur de X-User-Id)
 *   X-User-Roles (défaut : STUDENT,TEACHER,ADMIN -> tous les endpoints sont accessibles)
 * Le reste du code (CurrentUserProvider, @PreAuthorize) fonctionne exactement comme avec Keycloak.
 */
@Configuration
@Profile("local")
@EnableWebSecurity
@EnableMethodSecurity
public class LocalSecurityConfig {

    @Bean
    public SecurityFilterChain localSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .addFilterBefore(new LocalUserFilter(), AnonymousAuthenticationFilter.class);
        return http.build();
    }

    static class LocalUserFilter extends OncePerRequestFilter {

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws ServletException, IOException {
            String userId = valueOrDefault(request.getHeader("X-User-Id"), "student1");
            String name = valueOrDefault(request.getHeader("X-User-Name"), userId);
            List<String> roles = Arrays.stream(valueOrDefault(request.getHeader("X-User-Roles"), "STUDENT,TEACHER,ADMIN").split(","))
                    .map(String::trim)
                    .filter(r -> !r.isEmpty())
                    .map(r -> r.toUpperCase(Locale.ROOT))
                    .toList();

            Instant now = Instant.now();
            Jwt jwt = Jwt.withTokenValue("local-token")
                    .header("alg", "none")
                    .subject(userId)
                    .claim("name", name)
                    .claim("preferred_username", userId)
                    .claim("realm_access", Map.of("roles", roles))
                    .issuedAt(now)
                    .expiresAt(now.plusSeconds(3600))
                    .build();
            List<GrantedAuthority> authorities = roles.stream()
                    .map(r -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + r))
                    .toList();

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(new JwtAuthenticationToken(jwt, authorities, userId));
            SecurityContextHolder.setContext(context);
            try {
                chain.doFilter(request, response);
            } finally {
                SecurityContextHolder.clearContext();
            }
        }

        private static String valueOrDefault(String value, String fallback) {
            return (value == null || value.isBlank()) ? fallback : value;
        }
    }
}
