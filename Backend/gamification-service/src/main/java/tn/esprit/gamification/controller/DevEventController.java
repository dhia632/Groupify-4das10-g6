package tn.esprit.gamification.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.gamification.config.GamificationProperties;
import tn.esprit.gamification.messaging.event.PlatformEvent;

import java.util.Map;

/**
 * OUTIL DE DÉMO, actif uniquement avec le profil "dev".
 * Publie un événement sur RabbitMQ comme le feraient les autres microservices,
 * pour tester la gamification avant que Profiling / Course-Group soient développés.
 */
@Tag(name = "Dev - simulation d'événements")
@Profile("dev & !local")
@RestController
@RequestMapping("/api/gamification/dev/events")
@RequiredArgsConstructor
public class DevEventController {

    private final RabbitTemplate rabbitTemplate;
    private final GamificationProperties properties;

    @Operation(summary = "Publier un événement (routingKey : profile.completed, groups.published, contribution.recorded, deliverable.submitted)")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping("/{routingKey}")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public PlatformEvent publish(@PathVariable String routingKey, @RequestBody Map<String, Object> payload) {
        PlatformEvent event = PlatformEvent.of(routingKey, payload);
        rabbitTemplate.convertAndSend(properties.rabbit().exchange(), routingKey, event);
        return event;
    }
}
