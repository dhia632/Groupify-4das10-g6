package tn.esprit.gamification.security;

import java.util.Set;

/** Utilisateur authentifié, extrait du JWT. Le studentId vient toujours du token, jamais du corps de la requête. */
public record CurrentUser(String studentId, String displayName, Set<String> roles) {

    public boolean isTeacherOrAdmin() {
        return roles.contains("ROLE_TEACHER") || roles.contains("ROLE_ADMIN");
    }
}
