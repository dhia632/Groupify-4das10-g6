package tn.esprit.gamification.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.gamification.dto.BadgeDtos.BadgeAwardDTO;
import tn.esprit.gamification.dto.CatalogDtos.AvatarChoiceRequest;
import tn.esprit.gamification.dto.PlayerDtos.PlayerDTO;
import tn.esprit.gamification.dto.PlayerDtos.PointTransactionDTO;
import tn.esprit.gamification.security.CurrentUserProvider;
import tn.esprit.gamification.service.BadgeService;
import tn.esprit.gamification.service.PlayerService;

import java.util.List;

@Tag(name = "Joueurs", description = "Profil de jeu, points, niveau, badges, avatar")
@RestController
@RequestMapping("/api/gamification/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;
    private final BadgeService badgeService;
    private final CurrentUserProvider currentUser;

    @Operation(summary = "Mon profil de jeu (créé automatiquement au premier appel)")
    @GetMapping("/me")
    public PlayerDTO me() {
        return playerService.getMe(currentUser.get());
    }

    @Operation(summary = "Mes badges")
    @GetMapping("/me/badges")
    public List<BadgeAwardDTO> myBadges() {
        return playerService.myBadges(currentUser.get());
    }

    @Operation(summary = "Historique paginé de mes points")
    @GetMapping("/me/points-history")
    public Page<PointTransactionDTO> pointsHistory(@RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size) {
        return playerService.pointsHistory(currentUser.get(), page, size);
    }

    @Operation(summary = "Choisir mon avatar (403 si l'avatar est verrouillé par niveau)")
    @PutMapping("/me/avatar")
    public PlayerDTO chooseAvatar(@Valid @RequestBody AvatarChoiceRequest request) {
        return playerService.chooseAvatar(currentUser.get(), request.avatarId());
    }

    @Operation(summary = "Profil de jeu d'un étudiant (enseignant)")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @GetMapping("/{studentId}")
    public PlayerDTO byStudent(@PathVariable String studentId) {
        return playerService.getByStudentId(studentId);
    }

    @Operation(summary = "Attribuer manuellement un badge (enseignant)")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/{studentId}/badges/{badgeId}")
    @ResponseStatus(HttpStatus.CREATED)
    public BadgeAwardDTO awardBadge(@PathVariable String studentId, @PathVariable Long badgeId) {
        return badgeService.awardManually(studentId, badgeId, currentUser.get());
    }
}
