package tn.esprit.gamification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.gamification.entity.Level;
import tn.esprit.gamification.entity.PlayerProfile;
import tn.esprit.gamification.entity.PointTransaction;
import tn.esprit.gamification.entity.Team;
import tn.esprit.gamification.enums.EventType;
import tn.esprit.gamification.messaging.event.DomainEvents.LevelUp;
import tn.esprit.gamification.messaging.event.DomainEvents.TeamPointsUpdated;
import tn.esprit.gamification.repository.PointTransactionRepository;

import java.time.Instant;
import java.time.LocalDateTime;

/** Unique point d'entrée pour créditer des points : journal + total joueur + total équipe + passage de niveau. */
@Service
@RequiredArgsConstructor
public class PointService {

    private final PointTransactionRepository transactionRepository;
    private final LevelService levelService;
    private final ApplicationEventPublisher events;

    /**
     * Crédite des points de façon idempotente.
     *
     * @return false si cet événement a déjà crédité ce joueur (doublon ignoré)
     */
    @Transactional
    public boolean credit(PlayerProfile player, Team team, int points, EventType reason, String sourceEventId) {
        if (transactionRepository.existsByPlayerAndSourceEventId(player, sourceEventId)) {
            return false;
        }
        Level before = levelService.levelFor(player.getTotalPoints());

        transactionRepository.save(PointTransaction.builder()
                .player(player)
                .team(team)
                .points(points)
                .reason(reason)
                .sourceEventId(sourceEventId)
                .createdAt(LocalDateTime.now())
                .build());
        player.addPoints(points);

        if (team != null && points > 0) {
            team.addPoints(points);
            events.publishEvent(new TeamPointsUpdated(team.getId(), team.getGroupId(), team.getCourseId(),
                    team.getTotalPoints(), team.progressPercent()));
        }

        Level after = levelService.levelFor(player.getTotalPoints());
        if (after.getRank() > before.getRank()) {
            events.publishEvent(new LevelUp(player.getStudentId(), after.getRank(), after.getName(), Instant.now()));
        }
        return true;
    }
}
