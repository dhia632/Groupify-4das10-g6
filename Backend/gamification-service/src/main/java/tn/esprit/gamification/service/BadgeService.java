package tn.esprit.gamification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.gamification.dto.BadgeDtos.BadgeAwardDTO;
import tn.esprit.gamification.dto.BadgeDtos.BadgeDTO;
import tn.esprit.gamification.dto.BadgeDtos.BadgeRequest;
import tn.esprit.gamification.entity.Badge;
import tn.esprit.gamification.entity.BadgeAward;
import tn.esprit.gamification.entity.PlayerProfile;
import tn.esprit.gamification.entity.Team;
import tn.esprit.gamification.exception.ApiException;
import tn.esprit.gamification.mapper.GamificationMapper;
import tn.esprit.gamification.repository.BadgeAwardRepository;
import tn.esprit.gamification.repository.BadgeRepository;
import tn.esprit.gamification.security.CurrentUser;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final BadgeAwardRepository awardRepository;
    private final PlayerService playerService;
    private final BadgeEngine badgeEngine;
    private final GamificationMapper mapper;

    @Transactional(readOnly = true)
    public List<BadgeDTO> findActive() {
        return badgeRepository.findByActiveTrueOrderByCategoryAscNameAsc().stream().map(mapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public BadgeDTO findById(Long id) {
        return mapper.toDto(load(id));
    }

    @Transactional
    public BadgeDTO create(BadgeRequest request) {
        if (badgeRepository.existsByCode(request.code())) {
            throw ApiException.conflict("Un badge avec le code " + request.code() + " existe déjà");
        }
        Badge badge = Badge.builder()
                .code(request.code())
                .active(true)
                .build();
        apply(badge, request);
        return mapper.toDto(badgeRepository.save(badge));
    }

    @Transactional
    public BadgeDTO update(Long id, BadgeRequest request) {
        Badge badge = load(id);
        if (!badge.getCode().equals(request.code())) {
            throw ApiException.badRequest("Le code d'un badge ne peut pas être modifié");
        }
        apply(badge, request);
        return mapper.toDto(badge);
    }

    /** Suppression logique : les badges déjà obtenus restent visibles dans l'historique des étudiants. */
    @Transactional
    public void deactivate(Long id) {
        load(id).setActive(false);
    }

    @Transactional
    public BadgeAwardDTO awardManually(String studentId, Long badgeId, CurrentUser teacher) {
        PlayerProfile player = playerService.getExisting(studentId);
        Badge badge = load(badgeId);
        if (!badge.isActive()) {
            throw ApiException.badRequest("Ce badge est désactivé");
        }
        Team team = playerService.currentTeam(studentId);
        boolean awarded = badgeEngine.award(player, badge, team, "manual:" + UUID.randomUUID(), true, teacher.studentId());
        if (!awarded) {
            throw ApiException.conflict("L'étudiant possède déjà ce badge");
        }
        BadgeAward award = awardRepository.findByPlayerOrderByAwardedAtDesc(player).stream()
                .filter(a -> a.getBadge().getId().equals(badgeId))
                .findFirst()
                .orElseThrow();
        return mapper.toDto(award);
    }

    private Badge load(Long id) {
        return badgeRepository.findById(id).orElseThrow(() -> ApiException.notFound("Badge introuvable : " + id));
    }

    private void apply(Badge badge, BadgeRequest r) {
        badge.setName(r.name());
        badge.setDescription(r.description());
        badge.setIconUrl(r.iconUrl());
        badge.setCategory(r.category());
        badge.setRewardPoints(r.rewardPoints());
        badge.replaceRules(r.rules().stream().map(mapper::toEntity).toList());
    }
}
