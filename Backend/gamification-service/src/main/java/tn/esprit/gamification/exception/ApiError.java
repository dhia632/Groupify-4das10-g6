package tn.esprit.gamification.exception;

import java.time.Instant;

/** Format d'erreur commun à toutes les réponses en échec. */
public record ApiError(Instant timestamp, int status, String error, String message, String path) {
}
