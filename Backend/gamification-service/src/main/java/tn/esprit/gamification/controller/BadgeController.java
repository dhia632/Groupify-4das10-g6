package tn.esprit.gamification.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.gamification.dto.BadgeDtos.BadgeDTO;
import tn.esprit.gamification.dto.BadgeDtos.BadgeRequest;
import tn.esprit.gamification.service.BadgeService;

import java.util.List;

@Tag(name = "Badges", description = "Catalogue des badges et de leurs règles d'attribution")
@RestController
@RequestMapping("/api/gamification/badges")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;

    @Operation(summary = "Badges actifs")
    @GetMapping
    public List<BadgeDTO> list() {
        return badgeService.findActive();
    }

    @Operation(summary = "Détail d'un badge et de ses règles")
    @GetMapping("/{id}")
    public BadgeDTO get(@PathVariable Long id) {
        return badgeService.findById(id);
    }

    @Operation(summary = "Créer un badge (enseignant / admin)")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BadgeDTO create(@Valid @RequestBody BadgeRequest request) {
        return badgeService.create(request);
    }

    @Operation(summary = "Modifier un badge et ses règles")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PutMapping("/{id}")
    public BadgeDTO update(@PathVariable Long id, @Valid @RequestBody BadgeRequest request) {
        return badgeService.update(id, request);
    }

    @Operation(summary = "Désactiver un badge (suppression logique)")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        badgeService.deactivate(id);
    }
}
