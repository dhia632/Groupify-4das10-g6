package tn.esprit.gamification.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.gamification.dto.TeamDtos.*;
import tn.esprit.gamification.security.CurrentUserProvider;
import tn.esprit.gamification.service.KudosService;
import tn.esprit.gamification.service.TeamService;

import java.util.List;

@Tag(name = "Équipes", description = "Identité d'équipe, tableau de bord, classement, engagement")
@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;
    private final KudosService kudosService;
    private final CurrentUserProvider currentUser;

    @Operation(summary = "Identité d'une équipe (membres ou enseignant)")
    @GetMapping("/teams/{teamId}")
    public TeamDTO get(@PathVariable Long teamId) {
        return teamService.getTeam(teamId, currentUser.get());
    }

    @Operation(summary = "Modifier le nom et l'emblème de son équipe (409 si le nom est pris dans le module)")
    @PatchMapping("/teams/{teamId}/identity")
    public TeamDTO updateIdentity(@PathVariable Long teamId, @Valid @RequestBody TeamIdentityRequest request) {
        return teamService.updateIdentity(teamId, currentUser.get(), request);
    }

    @Operation(summary = "Tableau de bord : progression, répartition des contributions, badges d'équipe")
    @GetMapping("/teams/{teamId}/dashboard")
    public TeamDashboardDTO dashboard(@PathVariable Long teamId) {
        return teamService.dashboard(teamId, currentUser.get());
    }

    @Operation(summary = "Kudos échangés dans l'équipe")
    @GetMapping("/teams/{teamId}/kudos")
    public List<KudosDTO> kudos(@PathVariable Long teamId) {
        return kudosService.listForTeam(teamId, currentUser.get());
    }

    @Operation(summary = "Classement des équipes d'un module")
    @GetMapping("/courses/{courseId}/leaderboard")
    public List<LeaderboardEntryDTO> leaderboard(@PathVariable Long courseId,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size) {
        return teamService.leaderboard(courseId, page, size);
    }

    @Operation(summary = "Indicateurs d'engagement d'un module (enseignant, admin, service Analytics)")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN','SERVICE')")
    @GetMapping("/courses/{courseId}/engagement")
    public EngagementDTO engagement(@PathVariable Long courseId) {
        return teamService.engagement(courseId);
    }
}
