package tn.esprit.gateway.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * PROFIL "local" UNIQUEMENT – démo sans Keycloak : la Gateway laisse passer les requêtes.
 * Le Gamification Service (lui aussi en profil local) simule l'utilisateur via l'en-tête X-User-Id,
 * que la Gateway transmet tel quel.
 */
@Configuration
@Profile("local")
@EnableWebFluxSecurity
public class LocalSecurityConfig {

    @Bean
    public SecurityWebFilterChain localSecurityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(Customizer.withDefaults())
                .authorizeExchange(ex -> ex.anyExchange().permitAll())
                .build();
    }
}
