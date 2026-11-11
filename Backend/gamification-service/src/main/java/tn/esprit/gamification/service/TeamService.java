package tn.esprit.gamification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.gamification.client.GroupClient;
import tn.esprit.gamification.client.GroupDTO;
import tn.esprit.gamification.dto.TeamDtos.*;
import tn.esprit.gamification.entity.Emblem;
import tn.esprit.gamification.entity.PlayerProfile;
import tn.esprit.gamification.entity.Team;
import tn.esprit.gamification.entity.TeamMembership;
import tn.esprit.gamification.enums.RuleScope;
import tn.esprit.gamification.exception.ApiException;
import tn.esprit.gamification.mapper.GamificationMapper;
import tn.esprit.gamification.repository.*;
import tn.esprit.gamification.repository.PointTransactionRepository.MemberPoints;
import tn.esprit.gamification.security.CurrentUser;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final EmblemRepository emblemRepository;
    private final BadgeRepository badgeRepository;
    private final BadgeAwardRepository awardRepository;
    private final TeamMembershipRepository membershipRepository;
    private final PointTransactionRepository transactionRepository;
    private final PlayerService playerService;
    private final GroupClient groupClient;
    private final GamificationMapper mapper;

    // ------------------------------------------------------------------ synchronisation avec Course / Group

    /** Crée (ou complète) l'équipe correspondant à un groupe publié par le Course / Group Service. */
    @Transactional
    public Team getOrCreateFromGroup(Long groupId, Long courseId, String name,
                                     List<String> memberIds, int deliverablesTotal) {
        Team team = teamRepository.findByGroupId(groupId).orElseGet(() -> teamRepository.save(Team.builder()
                .groupId(groupId)
                .courseId(courseId)
                .name(uniqueName(courseId, name, groupId))
                .deliverablesTotal(deliverablesTotal)
                .build()));
        if (deliverablesTotal > team.getDeliverablesTotal()) {
            team.setDeliverablesTotal(deliverablesTotal);
        }
        if (memberIds != null) {
            memberIds.forEach(id -> team.addMember(playerService.getOrCreate(id, null)));
        }
        return team;
    }

    /**
     * Retrouve l'équipe d'un groupe. Si elle est inconnue (événement groups.published perdu ou arrivé
     * dans le désordre), on la reconstruit par un appel SYNCHRONE OpenFeign au Course / Group Service.
     */
    @Transactional
    public Team findOrReconcile(Long groupId) {
        return teamRepository.findByGroupId(groupId).orElseGet(() -> {
            log.info("Équipe inconnue pour le groupe {} : réconciliation via course-group-service", groupId);
            GroupDTO group = groupClient.getGroup(groupId);
            return getOrCreateFromGroup(group.id(), group.courseId(), group.name(),
                    group.memberIds(), group.deliverablesTotal());
        });
    }

    // ------------------------------------------------------------------ API REST

    @Transactional(readOnly = true)
    public TeamDTO getTeam(Long teamId, CurrentUser user) {
        Team team = loadWithAccessCheck(teamId, user);
        return mapper.toDto(team);
    }

    @Transactional
    public TeamDTO updateIdentity(Long teamId, CurrentUser user, TeamIdentityRequest request) {
        Team team = load(teamId);
        if (!team.hasMember(user.studentId())) {
            throw ApiException.forbidden("Seuls les membres de l'équipe peuvent modifier son identité");
        }
        String newName = request.name().trim();
        if (teamRepository.existsByCourseIdAndNameIgnoreCaseAndIdNot(team.getCourseId(), newName, teamId)) {
            throw ApiException.conflict("Le nom '" + newName + "' est déjà utilisé dans ce module");
        }
        team.rename(newName);
        if (request.emblemId() != null) {
            Emblem emblem = emblemRepository.findById(request.emblemId())
                    .orElseThrow(() -> ApiException.notFound("Emblème introuvable : " + request.emblemId()));
            team.setEmblem(emblem);
        }
        return mapper.toDto(team);
    }

    @Transactional(readOnly = true)
    public TeamDashboardDTO dashboard(Long teamId, CurrentUser user) {
        Team team = loadWithAccessCheck(teamId, user);

        Map<String, Long> pointsByMember = transactionRepository.sumPointsByMember(teamId).stream()
                .collect(Collectors.toMap(MemberPoints::getStudentId, MemberPoints::getPoints));
        long total = pointsByMember.values().stream().mapToLong(Long::longValue).sum();

        List<MemberContributionDTO> contributions = team.getMemberships().stream()
                .map(TeamMembership::getPlayer)
                .map(p -> {
                    long pts = pointsByMember.getOrDefault(p.getStudentId(), 0L);
                    double share = total == 0 ? 0 : Math.round(1000.0 * pts / total) / 10.0;
                    String avatarUrl = p.getAvatar() == null ? null : p.getAvatar().getImageUrl();
                    return new MemberContributionDTO(p.getStudentId(), p.getDisplayName(), avatarUrl, pts, share);
                })
                .toList();

        return new TeamDashboardDTO(
                mapper.toDto(team),
                team.getDeliverablesTotal(),
                team.getDeliverablesSubmitted(),
                team.getOnTimeDeliveries(),
                contributions,
                badgeRepository.findTeamBadges(teamId, RuleScope.TEAM).stream().map(mapper::toDto).toList());
    }

    /** Classement des ÉQUIPES d'un module (gamification responsable : jamais d'individus). */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDTO> leaderboard(Long courseId, int page, int size) {
        if (teamRepository.countByCourseId(courseId) == 0) {
            throw ApiException.notFound("Aucune équipe pour le module " + courseId);
        }
        int pageSize = Math.min(size, 100);
        Page<Team> teams = teamRepository.findByCourseIdOrderByTotalPointsDescNameAsc(courseId, PageRequest.of(page, pageSize));
        int offset = page * pageSize;
        List<Team> content = teams.getContent();
        return java.util.stream.IntStream.range(0, content.size())
                .mapToObj(i -> {
                    Team t = content.get(i);
                    String emblemUrl = t.getEmblem() == null ? null : t.getEmblem().getImageUrl();
                    return new LeaderboardEntryDTO(offset + i + 1, t.getId(), t.getName(), emblemUrl,
                            t.getTotalPoints(), t.progressPercent());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public EngagementDTO engagement(Long courseId) {
        long teams = teamRepository.countByCourseId(courseId);
        if (teams == 0) {
            throw ApiException.notFound("Aucune équipe pour le module " + courseId);
        }
        return new EngagementDTO(
                courseId,
                teams,
                membershipRepository.countPlayersInCourse(courseId),
                membershipRepository.countActivePlayersInCourse(courseId, LocalDateTime.now().minusDays(7)),
                Math.round(teamRepository.averagePointsInCourse(courseId) * 10) / 10.0,
                awardRepository.countAwardsInCourse(courseId));
    }

    // ------------------------------------------------------------------ utilitaires

    public Team load(Long teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> ApiException.notFound("Équipe introuvable : " + teamId));
    }

    public Team loadWithAccessCheck(Long teamId, CurrentUser user) {
        Team team = load(teamId);
        if (!user.isTeacherOrAdmin() && !team.hasMember(user.studentId())) {
            throw ApiException.forbidden("Vous n'êtes pas membre de cette équipe");
        }
        return team;
    }

    private String uniqueName(Long courseId, String wanted, Long groupId) {
        String base = (wanted == null || wanted.isBlank()) ? "Équipe " + groupId : wanted.trim();
        return teamRepository.existsByCourseIdAndNameIgnoreCase(courseId, base) ? base + " #" + groupId : base;
    }

    public List<PlayerProfile> members(Team team) {
        return team.getMemberships().stream().map(TeamMembership::getPlayer).toList();
    }
}
