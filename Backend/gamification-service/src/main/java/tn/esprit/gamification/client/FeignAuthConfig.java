package tn.esprit.gamification.client;

import feign.RequestInterceptor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.security.oauth2.client.*;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

/**
 * Les appels Feign partent souvent d'un listener RabbitMQ, donc sans utilisateur connecté.
 * Le service s'authentifie lui-même auprès de Keycloak (grant client_credentials)
 * et ajoute le jeton obtenu dans l'en-tête Authorization.
 */
@Slf4j
@Configuration
public class FeignAuthConfig {

    private static final String REGISTRATION_ID = "keycloak-service";

    @Bean
    public OAuth2AuthorizedClientManager authorizedClientManager(ClientRegistrationRepository registrations,
                                                                 OAuth2AuthorizedClientService clientService) {
        AuthorizedClientServiceOAuth2AuthorizedClientManager manager =
                new AuthorizedClientServiceOAuth2AuthorizedClientManager(registrations, clientService);
        manager.setAuthorizedClientProvider(OAuth2AuthorizedClientProviderBuilder.builder().clientCredentials().build());
        return manager;
    }

    @Bean
    public RequestInterceptor serviceTokenInterceptor(OAuth2AuthorizedClientManager manager) {
        return template -> {
            OAuth2AuthorizeRequest request = OAuth2AuthorizeRequest
                    .withClientRegistrationId(REGISTRATION_ID)
                    .principal("gamification-service")
                    .build();
            OAuth2AuthorizedClient client = manager.authorize(request);
            if (client != null) {
                template.header(HttpHeaders.AUTHORIZATION, "Bearer " + client.getAccessToken().getTokenValue());
            }
        };
    }
}
