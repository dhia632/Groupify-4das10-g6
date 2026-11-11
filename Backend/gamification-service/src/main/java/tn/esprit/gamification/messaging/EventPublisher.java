package tn.esprit.gamification.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import tn.esprit.gamification.config.GamificationProperties;
import tn.esprit.gamification.messaging.event.DomainEvents.BadgeAwarded;
import tn.esprit.gamification.messaging.event.DomainEvents.LevelUp;
import tn.esprit.gamification.messaging.event.DomainEvents.TeamPointsUpdated;
import tn.esprit.gamification.messaging.event.PlatformEvent;

/**
 * Publie les événements du service sur RabbitMQ, uniquement après le commit en base :
 * on n'annonce jamais un badge qui n'a pas été réellement enregistré.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final GamificationProperties properties;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void on(BadgeAwarded event) {
        send(RabbitConfig.BADGE_AWARDED, event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void on(LevelUp event) {
        send(RabbitConfig.LEVEL_UP, event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void on(TeamPointsUpdated event) {
        send(RabbitConfig.TEAM_POINTS_UPDATED, event);
    }

    private void send(String routingKey, Object payload) {
        PlatformEvent envelope = PlatformEvent.of(routingKey, payload);
        if (!properties.rabbit().publishEnabled()) {
            log.info("[profil local] Événement non publié (RabbitMQ désactivé) [{}] : {}", routingKey, payload);
            return;
        }
        try {
            rabbitTemplate.convertAndSend(properties.rabbit().exchange(), routingKey, envelope);
            log.info("Événement publié [{}] id={}", routingKey, envelope.eventId());
        } catch (AmqpException ex) {
            // Les données sont déjà en base : on journalise sans annuler l'opération métier.
            // Évolution possible : pattern Outbox pour garantir la publication.
            log.error("Publication impossible [{}] : {}", routingKey, ex.getMessage());
        }
    }
}
