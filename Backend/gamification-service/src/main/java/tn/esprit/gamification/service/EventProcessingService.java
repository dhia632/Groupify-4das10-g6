package tn.esprit.gamification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.gamification.config.GamificationProperties;
import tn.esprit.gamification.entity.PlayerProfile;
import tn.esprit.gamification.entity.ProcessedEvent;
import tn.esprit.gamification.entity.Team;
import tn.esprit.gamification.enums.EventType;
import tn.esprit.gamification.messaging.RabbitConfig;
import tn.esprit.gamification.messaging.event.InboundPayloads.*;
import tn.esprit.gamification.messaging.event.PlatformEvent;
import tn.esprit.gamification.repository.PointTransactionRepository;
import tn.esprit.gamification.repository.ProcessedEventRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Traduit les événements des autres microservices en points et en badges.
 * Tout le traitement d'un événement se fait dans UNE transaction : soit tout est appliqué, soit rien.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EventProcessingService {

    private final ProcessedEventRepository processedEventRepository;
    private final PointTransactionRepository transactionRepository;
    private final PlayerService playerService;
    private final TeamService teamService;
    private final PointService pointService;
    private final BadgeEngine badgeEngine;
    private final ObjectMapper objectMapper;
    private final GamificationProperties properties;

    @Transactional
    public void handle(String routingKey, PlatformEvent event) {
        if (event.eventId() == null) {
            throw new IllegalArgumentException("Événement sans eventId");
        }
        if (processedEventRepository.existsById(event.eventId())) {
            log.info("Événement {} déjà traité : ignoré (idempotence)", event.eventId());
            return;
        }

        switch (routingKey) {
            case RabbitConfig.PROFILE_COMPLETED -> onProfileCompleted(event.eventId(), read(event, ProfileCompleted.class));
            case RabbitConfig.GROUPS_PUBLISHED -> onGroupsPublished(event.eventId(), read(event, GroupsPublished.class));
            case RabbitConfig.CONTRIBUTION_RECORDED -> onContribution(event.eventId(), read(event, ContributionRecorded.class));
            case RabbitConfig.DELIVERABLE_SUBMITTED -> onDeliverable(event.eventId(), read(event, DeliverableSubmitted.class));
            default -> log.warn("Routing key non gérée : {}", routingKey);
        }

        processedEventRepository.save(ProcessedEvent.builder()
                .eventId(event.eventId())
                .eventType(routingKey)
                .processedAt(LocalDateTime.now())
                .build());
    }

    private void onProfileCompleted(String eventId, ProfileCompleted p) {
        PlayerProfile player = playerService.getOrCreate(p.studentId(), p.displayName());
        Team team = playerService.currentTeam(p.studentId());
        pointService.credit(player, team, rules().profileCompletedPoints(), EventType.PROFILE_COMPLETED, eventId);
        badgeEngine.evaluate(EventType.PROFILE_COMPLETED, List.of(player), team, eventId);
    }

    private void onGroupsPublished(String eventId, GroupsPublished p) {
        for (PublishedGroup g : p.groups()) {
            Team team = teamService.getOrCreateFromGroup(g.groupId(), p.courseId(), g.name(),
                    g.memberIds(), g.deliverablesTotal());
            List<PlayerProfile> members = teamService.members(team);
            members.forEach(m -> pointService.credit(m, team, rules().groupJoinedPoints(), EventType.GROUP_JOINED, eventId));
            badgeEngine.evaluate(EventType.GROUP_JOINED, members, team, eventId);
        }
    }

    private void onContribution(String eventId, ContributionRecorded p) {
        Team team = teamService.findOrReconcile(p.groupId());
        PlayerProfile player = playerService.getOrCreate(p.studentId(), null);
        team.addMember(player);

        // Plafond journalier : on enregistre quand même la contribution (0 point) pour les compteurs de badges
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long alreadyToday = transactionRepository.sumPointsSince(player, EventType.CONTRIBUTION_RECORDED, startOfDay);
        int points = (int) Math.max(0, Math.min(rules().contributionPoints(), rules().contributionDailyCap() - alreadyToday));
        pointService.credit(player, team, points, EventType.CONTRIBUTION_RECORDED, eventId);
        badgeEngine.evaluate(EventType.CONTRIBUTION_RECORDED, List.of(player), team, eventId);

        // Série de jours actifs (badge de régularité)
        if (playerService.registerActivity(player, toLocal(p.recordedAt()))) {
            pointService.credit(player, team, rules().dailyActivityPoints(), EventType.DAILY_ACTIVITY, eventId + ":daily");
            badgeEngine.evaluate(EventType.DAILY_ACTIVITY, List.of(player), team, eventId);
        }
    }

    private void onDeliverable(String eventId, DeliverableSubmitted p) {
        Team team = teamService.findOrReconcile(p.groupId());
        boolean onTime = p.dueDate() == null || p.submittedAt() == null || !p.submittedAt().isAfter(p.dueDate());

        team.setDeliverablesSubmitted(team.getDeliverablesSubmitted() + 1);
        if (team.getDeliverablesSubmitted() > team.getDeliverablesTotal()) {
            team.setDeliverablesTotal(team.getDeliverablesSubmitted());
        }
        if (onTime) {
            team.setOnTimeDeliveries(team.getOnTimeDeliveries() + 1);
        }

        int points = onTime ? rules().deliverableOnTimePoints() : rules().deliverableLatePoints();
        List<PlayerProfile> members = teamService.members(team);
        members.forEach(m -> pointService.credit(m, team, points, EventType.DELIVERABLE_SUBMITTED, eventId));
        badgeEngine.evaluate(EventType.DELIVERABLE_SUBMITTED, members, team, eventId);
    }

    private <T> T read(PlatformEvent event, Class<T> type) {
        return objectMapper.convertValue(event.payload(), type);
    }

    private static LocalDateTime toLocal(Instant instant) {
        return instant == null ? LocalDateTime.now() : LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
    }

    private GamificationProperties.Rules rules() {
        return properties.rules();
    }
}
