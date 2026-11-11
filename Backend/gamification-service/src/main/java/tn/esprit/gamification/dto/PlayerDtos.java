package tn.esprit.gamification.dto;

import tn.esprit.gamification.dto.CatalogDtos.AvatarDTO;
import tn.esprit.gamification.dto.CatalogDtos.LevelDTO;
import tn.esprit.gamification.enums.EventType;

import java.time.LocalDateTime;

public final class PlayerDtos {

    private PlayerDtos() {
    }

    public record PlayerDTO(
            String studentId,
            String displayName,
            AvatarDTO avatar,
            int totalPoints,
            LevelDTO level,
            LevelDTO nextLevel,
            double progressToNextLevel,
            long badgesCount,
            int currentStreakDays,
            Long teamId) {
    }

    public record PointTransactionDTO(int points, EventType reason, String sourceEventId, LocalDateTime createdAt) {
    }
}
