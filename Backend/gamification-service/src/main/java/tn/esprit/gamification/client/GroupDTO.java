package tn.esprit.gamification.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/** Réponse attendue de GET /api/groups/{groupId} du Course / Group Service. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GroupDTO(Long id, Long courseId, String name, List<String> memberIds, int deliverablesTotal) {
}
