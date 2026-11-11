package tn.esprit.gamification.messaging.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Enveloppe commune à tous les événements échangés sur l'exchange "platform.events".
 * eventId sert à l'idempotence ; payload dépend du type d'événement.
 */
public record PlatformEvent(String eventId, String eventType, Instant occurredAt, Object payload) {

    public static PlatformEvent of(String eventType, Object payload) {
        return new PlatformEvent(UUID.randomUUID().toString(), eventType, Instant.now(), payload);
    }
}
