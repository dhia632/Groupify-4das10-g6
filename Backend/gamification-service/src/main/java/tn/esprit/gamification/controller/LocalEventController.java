package tn.esprit.gamification.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tn.esprit.gamification.messaging.event.PlatformEvent;
import tn.esprit.gamification.service.EventProcessingService;

import java.util.Map;

/**
 * PROFIL "local" UNIQUEMENT – sans RabbitMQ, l'événement simulé est traité directement,
 * exactement comme s'il venait de la file gamification.queue.
 */
@Tag(name = "Dev - simulation d'événements (local, sans RabbitMQ)")
@Profile("local")
@RestController
@RequestMapping("/api/gamification/dev/events")
@RequiredArgsConstructor
public class LocalEventController {

    private final EventProcessingService processingService;

    @Operation(summary = "Simuler un événement reçu (routingKey : groups.published, profile.completed, contribution.recorded, deliverable.submitted)")
    @PostMapping("/{routingKey}")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public PlatformEvent simulate(@PathVariable String routingKey, @RequestBody Map<String, Object> payload) {
        PlatformEvent event = PlatformEvent.of(routingKey, payload);
        processingService.handle(routingKey, event);
        return event;
    }
}
