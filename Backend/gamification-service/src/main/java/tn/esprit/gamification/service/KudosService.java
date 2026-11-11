package tn.esprit.gamification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.gamification.config.GamificationProperties;
import tn.esprit.gamification.dto.TeamDtos.KudosDTO;
import tn.esprit.gamification.dto.TeamDtos.KudosRequest;
import tn.esprit.gamification.entity.Kudos;
import tn.esprit.gamification.entity.PlayerProfile;
import tn.esprit.gamification.entity.Team;
import tn.esprit.gamification.enums.EventType;
import tn.esprit.gamification.exception.ApiException;
import tn.esprit.gamification.mapper.GamificationMapper;
import tn.esprit.gamification.repository.KudosRepository;
import tn.esprit.gamification.repository.TeamMembershipRepository;
import tn.esprit.gamification.security.CurrentUser;

import java.time.LocalDateTime;
import java.util.List;

/** Kudos = remerciement d'entraide entre coéquipiers ; alimente le badge de coopération "HELPER". */
@Service
@RequiredArgsConstructor
public class KudosService {

    private final KudosRepository kudosRepository;
    private final TeamMembershipRepository membershipRepository;
    private final PlayerService playerService;
    private final TeamService teamService;
    private final PointService pointService;
    private final BadgeEngine badgeEngine;
    private final GamificationMapper mapper;
    private final GamificationProperties properties;

    @Transactional
    public KudosDTO send(CurrentUser user, KudosRequest request) {
        if (user.studentId().equals(request.toStudentId())) {
            throw ApiException.badRequest("Impossible de s'envoyer un kudos à soi-même");
        }
        PlayerProfile sender = playerService.getOrCreate(user.studentId(), user.displayName());
        PlayerProfile receiver = playerService.getExisting(request.toStudentId());

        List<Team> commonTeams = membershipRepository.findCommonTeams(sender.getStudentId(), receiver.getStudentId());
        if (commonTeams.isEmpty()) {
            throw ApiException.forbidden("Un kudos ne peut être envoyé qu'à un membre de votre équipe");
        }
        long sentThisWeek = kudosRepository.countBySenderAndCreatedAtAfter(sender, LocalDateTime.now().minusDays(7));
        if (sentThisWeek >= properties.rules().kudosWeeklyQuota()) {
            throw ApiException.tooManyRequests("Quota atteint : " + properties.rules().kudosWeeklyQuota() + " kudos par semaine");
        }

        Team team = commonTeams.get(0);
        Kudos kudos = kudosRepository.save(Kudos.builder()
                .sender(sender)
                .receiver(receiver)
                .team(team)
                .message(request.message())
                .createdAt(LocalDateTime.now())
                .build());

        String sourceEventId = "kudos:" + kudos.getId();
        pointService.credit(receiver, team, properties.rules().kudosPoints(), EventType.KUDOS_RECEIVED, sourceEventId);
        badgeEngine.evaluate(EventType.KUDOS_RECEIVED, List.of(receiver), team, sourceEventId);
        return mapper.toDto(kudos);
    }

    @Transactional(readOnly = true)
    public List<KudosDTO> listForTeam(Long teamId, CurrentUser user) {
        teamService.loadWithAccessCheck(teamId, user);
        return kudosRepository.findByTeam_IdOrderByCreatedAtDesc(teamId).stream().map(mapper::toDto).toList();
    }
}
