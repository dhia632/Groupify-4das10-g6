package tn.esprit.gamification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.gamification.dto.BadgeDtos.BadgeAwardDTO;
import tn.esprit.gamification.dto.PlayerDtos.PlayerDTO;
import tn.esprit.gamification.dto.PlayerDtos.PointTransactionDTO;
import tn.esprit.gamification.entity.Avatar;
import tn.esprit.gamification.entity.Level;
import tn.esprit.gamification.entity.PlayerProfile;
import tn.esprit.gamification.entity.Team;
import tn.esprit.gamification.entity.TeamMembership;
import tn.esprit.gamification.exception.ApiException;
import tn.esprit.gamification.mapper.GamificationMapper;
import tn.esprit.gamification.repository.*;
import tn.esprit.gamification.security.CurrentUser;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerProfileRepository playerRepository;
    private final AvatarRepository avatarRepository;
    private final BadgeAwardRepository awardRepository;
    private final PointTransactionRepository transactionRepository;
    private final TeamMembershipRepository membershipRepository;
    private final LevelService levelService;
    private final GamificationMapper mapper;

    /** Récupère le profil de jeu, ou le crée à la première apparition de l'étudiant. */
    @Transactional
    public PlayerProfile getOrCreate(String studentId, String displayName) {
        PlayerProfile player = playerRepository.findByStudentId(studentId)
                .orElseGet(() -> playerRepository.save(PlayerProfile.builder()
                        .studentId(studentId)
                        .displayName(displayName)
                        .build()));
        if (displayName != null && !displayName.isBlank() && !displayName.equals(player.getDisplayName())) {
            player.setDisplayName(displayName);
        }
        return player;
    }

    @Transactional(readOnly = true)
    public PlayerProfile getExisting(String studentId) {
        return playerRepository.findByStudentId(studentId)
                .orElseThrow(() -> ApiException.notFound("Aucun profil de jeu pour l'étudiant " + studentId));
    }

    @Transactional
    public PlayerDTO getMe(CurrentUser user) {
        return toDto(getOrCreate(user.studentId(), user.displayName()));
    }

    @Transactional(readOnly = true)
    public PlayerDTO getByStudentId(String studentId) {
        return toDto(getExisting(studentId));
    }

    @Transactional
    public PlayerDTO chooseAvatar(CurrentUser user, Long avatarId) {
        PlayerProfile player = getOrCreate(user.studentId(), user.displayName());
        Avatar avatar = avatarRepository.findById(avatarId)
                .filter(Avatar::isActive)
                .orElseThrow(() -> ApiException.notFound("Avatar introuvable : " + avatarId));
        Level level = levelService.levelFor(player.getTotalPoints());
        if (level.getRank() < avatar.getRequiredLevel()) {
            throw ApiException.forbidden("Avatar verrouillé : niveau " + avatar.getRequiredLevel() + " requis");
        }
        player.setAvatar(avatar);
        return toDto(player);
    }

    @Transactional
    public List<BadgeAwardDTO> myBadges(CurrentUser user) {
        PlayerProfile player = getOrCreate(user.studentId(), user.displayName());
        return awardRepository.findByPlayerOrderByAwardedAtDesc(player).stream().map(mapper::toDto).toList();
    }

    @Transactional
    public Page<PointTransactionDTO> pointsHistory(CurrentUser user, int page, int size) {
        PlayerProfile player = getOrCreate(user.studentId(), user.displayName());
        return transactionRepository
                .findByPlayerOrderByCreatedAtDesc(player, PageRequest.of(page, Math.min(size, 100)))
                .map(mapper::toDto);
    }

    /** Équipe la plus récente de l'étudiant (null s'il n'a pas encore de groupe). */
    @Transactional(readOnly = true)
    public Team currentTeam(String studentId) {
        return membershipRepository.findByPlayer_StudentIdOrderByJoinedAtDesc(studentId).stream()
                .findFirst()
                .map(TeamMembership::getTeam)
                .orElse(null);
    }

    /**
     * Met à jour la série de jours actifs.
     *
     * @return true si c'est le premier jour d'activité enregistré pour cette date
     */
    public boolean registerActivity(PlayerProfile player, LocalDateTime at) {
        LocalDate today = at.toLocalDate();
        LocalDate last = player.getLastActivityAt() == null ? null : player.getLastActivityAt().toLocalDate();
        if (last != null && !today.isAfter(last)) {
            return false; // même jour (ou événement plus ancien) : pas de nouveau jour actif
        }
        if (last != null && last.plusDays(1).equals(today)) {
            player.setCurrentStreakDays(player.getCurrentStreakDays() + 1);
        } else {
            player.setCurrentStreakDays(1);
        }
        player.setLastActivityAt(at);
        return true;
    }

    private PlayerDTO toDto(PlayerProfile p) {
        int points = p.getTotalPoints();
        Team team = currentTeam(p.getStudentId());
        return new PlayerDTO(
                p.getStudentId(),
                p.getDisplayName(),
                mapper.toDto(p.getAvatar()),
                points,
                mapper.toDto(levelService.levelFor(points)),
                levelService.nextLevel(points).map(mapper::toDto).orElse(null),
                levelService.progressToNextLevel(points),
                awardRepository.countByPlayer(p),
                p.getCurrentStreakDays(),
                team == null ? null : team.getId());
    }
}
