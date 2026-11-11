package tn.esprit.gamification.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import tn.esprit.gamification.enums.BadgeCategory;
import tn.esprit.gamification.enums.ConditionType;
import tn.esprit.gamification.enums.EventType;
import tn.esprit.gamification.enums.RuleScope;

import java.time.LocalDateTime;
import java.util.List;

public final class BadgeDtos {

    private BadgeDtos() {
    }

    public record BadgeRuleDTO(
            @NotNull EventType triggerEvent,
            @NotNull ConditionType conditionType,
            @Min(1) int threshold,
            @NotNull RuleScope scope) {
    }

    public record BadgeDTO(
            Long id,
            String code,
            String name,
            String description,
            String iconUrl,
            BadgeCategory category,
            int rewardPoints,
            boolean active,
            List<BadgeRuleDTO> rules) {
    }

    public record BadgeRequest(
            @NotBlank @Size(max = 50) @Pattern(regexp = "[A-Z0-9_]+", message = "majuscules, chiffres et _ uniquement") String code,
            @NotBlank @Size(max = 80) String name,
            @Size(max = 500) String description,
            String iconUrl,
            @NotNull BadgeCategory category,
            @Min(0) @Max(500) int rewardPoints,
            @NotEmpty @Valid List<BadgeRuleDTO> rules) {
    }

    public record BadgeAwardDTO(BadgeDTO badge, LocalDateTime awardedAt, boolean manual) {
    }
}
