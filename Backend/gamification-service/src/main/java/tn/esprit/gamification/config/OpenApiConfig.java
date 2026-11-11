package tn.esprit.gamification.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

import java.util.List;

/**
 * Swagger :
 *  - normal : bouton "Authorize" pour coller un access token Keycloak ;
 *  - profil local : bouton "Authorize" pour choisir l'utilisateur simulé (en-tête X-User-Id).
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI gamificationOpenApi(Environment environment) {
        boolean local = environment.acceptsProfiles(Profiles.of("local"));

        OpenAPI api = new OpenAPI()
                .info(new Info()
                        .title("Gamification Service API")
                        .version("v1")
                        .description("Avatars, points, niveaux, badges, identité d'équipe, classement et kudos"
                                + (local ? " — PROFIL LOCAL : sécurité Keycloak désactivée" : "")))
                // URL relative : "Try it out" fonctionne aussi bien depuis :8084 que depuis le Swagger de la Gateway :8080
                .servers(List.of(new Server().url("/")));

        if (local) {
            return api
                    .addSecurityItem(new SecurityRequirement().addList("local-user"))
                    .components(new Components().addSecuritySchemes("local-user",
                            new SecurityScheme()
                                    .type(SecurityScheme.Type.APIKEY)
                                    .in(SecurityScheme.In.HEADER)
                                    .name("X-User-Id")
                                    .description("Identifiant de l'étudiant simulé (ex. student1, student2). Vide = student1.")));
        }
        return api
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"))
                .components(new Components().addSecuritySchemes("bearer-jwt",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
