package tn.esprit.gamification.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tn.esprit.gamification.dto.TeamDtos.KudosDTO;
import tn.esprit.gamification.dto.TeamDtos.KudosRequest;
import tn.esprit.gamification.security.CurrentUserProvider;
import tn.esprit.gamification.service.KudosService;

@Tag(name = "Kudos", description = "Remercier un coéquipier pour son aide")
@RestController
@RequestMapping("/api/gamification/kudos")
@RequiredArgsConstructor
public class KudosController {

    private final KudosService kudosService;
    private final CurrentUserProvider currentUser;

    @Operation(summary = "Envoyer un kudos (400 à soi-même, 403 hors équipe, 429 quota hebdomadaire)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public KudosDTO send(@Valid @RequestBody KudosRequest request) {
        return kudosService.send(currentUser.get(), request);
    }
}
