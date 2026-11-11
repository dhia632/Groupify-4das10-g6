package tn.esprit.gamification.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.gamification.dto.CatalogDtos.*;
import tn.esprit.gamification.service.CatalogService;

import java.util.List;

@Tag(name = "Catalogues", description = "Avatars, emblèmes, niveaux")
@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @Operation(summary = "Bibliothèque d'avatars")
    @GetMapping("/avatars")
    public List<AvatarDTO> avatars() {
        return catalogService.avatars();
    }

    @Operation(summary = "Ajouter un avatar (admin)")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/avatars")
    @ResponseStatus(HttpStatus.CREATED)
    public AvatarDTO createAvatar(@Valid @RequestBody AvatarRequest request) {
        return catalogService.createAvatar(request);
    }

    @Operation(summary = "Désactiver un avatar (admin)")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/avatars/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAvatar(@PathVariable Long id) {
        catalogService.deactivateAvatar(id);
    }

    @Operation(summary = "Liste des emblèmes d'équipe")
    @GetMapping("/emblems")
    public List<EmblemDTO> emblems() {
        return catalogService.emblems();
    }

    @Operation(summary = "Paliers de niveaux")
    @GetMapping("/levels")
    public List<LevelDTO> levels() {
        return catalogService.levels();
    }
}
