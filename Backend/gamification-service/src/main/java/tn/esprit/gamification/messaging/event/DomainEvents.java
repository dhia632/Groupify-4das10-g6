package tn.esprit.gamification.messaging.event;

import java.time.Instant;

/**
 * Événements internes émis par les services métier (ApplicationEventPublisher).
 * Ils ne sont publiés sur RabbitMQ qu'APRÈS le commit de la transaction (voir EventPublisher).
 */
public final class DomainEvents {

    private DomainEvents() {
    }

    /** routing key : badge.awarded */
    public record BadgeAwarded(String studentId, String badgeCode, String badgeName, Instant awardedAt) {
    }

    /** routing key : level.up */
    public record LevelUp(String studentId, int newLevel, String levelName, Instant reachedAt) {
    }

    /** routing key : team.points.updated */
    public record TeamPointsUpdated(Long teamId, Long groupId, Long courseId, int totalPoints, double progressPercent) {
    }
}
