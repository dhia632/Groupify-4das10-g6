package tn.esprit.gamification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.gamification.entity.*;
import tn.esprit.gamification.enums.EventType;
import tn.esprit.gamification.enums.RuleScope;
import tn.esprit.gamification.messaging.event.DomainEvents.BadgeAwarded;
import tn.esprit.gamification.repository.BadgeAwardRepository;
import tn.esprit.gamification.repository.BadgeRuleRepository;
import tn.esprit.gamification.repository.PointTransactionRepository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Moteur de badges : après chaque événement, évalue les règles actives déclenchées par ce type d'événement.
 * Les règles sont stockées en base (paramétrables par l'enseignant), pas codées en dur.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BadgeEngine {

    private final BadgeRuleRepository ruleRepository;
    private final BadgeAwardRepository awardRepository;
    private final PointTransactionRepository transactionRepository;
    private final PointService pointService;
    private final ApplicationEventPublisher events;

    /**
     * @param players joueurs concernés par l'événement (règles de portée STUDENT)
     * @param team    équipe concernée, peut être null (règles de portée TEAM)
     */
    @Transactional
    public void evaluate(EventType type, List<PlayerProfile> players, Team team, String sourceEventId) {
        for (BadgeRule rule : ruleRepository.findByTriggerEventAndBadge_ActiveTrue(type)) {
            if (rule.getScope() == RuleScope.TEAM) {
                if (team != null && rule.isSatisfiedBy(teamCounter(rule, team))) {
                    team.getMemberships().forEach(m ->
                            award(m.getPlayer(), rule.getBadge(), team, sourceEventId, false, null));
                }
            } else {
                for (PlayerProfile player : players) {
                    if (rule.isSatisfiedBy(studentCounter(rule, player, team))) {
                        award(player, rule.getBadge(), team, sourceEventId, false, null);
                    }
                }
            }
        }
    }

    /** Attribue un badge s'il n'est pas déjà détenu, crédite le bonus et annonce l'événement. */
    @Transactional
    public boolean award(PlayerProfile player, Badge badge, Team team, String sourceEventId,
                         boolean manual, String awardedBy) {
        if (awardRepository.existsByPlayerAndBadge(player, badge)) {
            return false;
        }
        awardRepository.save(BadgeAward.builder()
                .player(player)
                .badge(badge)
                .awardedAt(LocalDateTime.now())
                .sourceEventId(sourceEventId)
                .manual(manual)
                .awardedBy(awardedBy)
                .build());
        if (badge.getRewardPoints() > 0) {
            pointService.credit(player, team, badge.getRewardPoints(), EventType.BADGE_REWARD, "badge:" + badge.getCode());
        }
        events.publishEvent(new BadgeAwarded(player.getStudentId(), badge.getCode(), badge.getName(), Instant.now()));
        log.info("Badge {} attribué à {}", badge.getCode(), player.getStudentId());
        return true;
    }

    private int studentCounter(BadgeRule rule, PlayerProfile player, Team team) {
        return switch (rule.getConditionType()) {
            case FIRST_OCCURRENCE, COUNT_THRESHOLD ->
                    (int) transactionRepository.countByPlayerAndReason(player, rule.getTriggerEvent());
            case STREAK_DAYS -> player.getCurrentStreakDays();
            case ON_TIME -> team != null ? team.getOnTimeDeliveries() : 0;
        };
    }

    private int teamCounter(BadgeRule rule, Team team) {
        return switch (rule.getConditionType()) {
            case ON_TIME -> team.getOnTimeDeliveries();
            case STREAK_DAYS -> team.getMemberships().stream()
                    .mapToInt(m -> m.getPlayer().getCurrentStreakDays())
                    .min().orElse(0);
            case FIRST_OCCURRENCE, COUNT_THRESHOLD -> team.getMemberships().stream()
                    .mapToInt(m -> (int) transactionRepository.countByPlayerAndReason(m.getPlayer(), rule.getTriggerEvent()))
                    .sum();
        };
    }
}
