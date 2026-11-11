package tn.esprit.gamification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import tn.esprit.gamification.dto.BadgeDtos.BadgeDTO;
import tn.esprit.gamification.dto.CatalogDtos.EmblemDTO;

import java.time.LocalDateTime;
import java.util.List;

public final class TeamDtos {

    private TeamDtos() {
    }

    public record TeamDTO(
            Long id,
            Long groupId,
            Long courseId,
            String name,
            EmblemDTO emblem,
            int totalPoints,
            double progressPercent,
            List<String> memberIds) {
    }

    public record TeamIdentityRequest(
            @NotBlank @Size(min = 3, max = 60) String name,
            Long emblemId) {
    }

    public record MemberContributionDTO(
            String studentId,
            String displayName,
            String avatarUrl,
            long points,
            double sharePercent) {
    }

    public record TeamDashboardDTO(
            TeamDTO team,
            int deliverablesTotal,
            int deliverablesSubmitted,
            int onTimeDeliveries,
            List<MemberContributionDTO> contributions,
            List<BadgeDTO> teamBadges) {
    }

    public record LeaderboardEntryDTO(
            int rank,
            Long teamId,
            String name,
            String emblemUrl,
            int totalPoints,
            double progressPercent) {
    }

    public record EngagementDTO(
            Long courseId,
            long teamsCount,
            long playersCount,
            long activePlayersLast7Days,
            double averageTeamPoints,
            long badgesAwarded) {
    }

    public record KudosRequest(
            @NotBlank String toStudentId,
            @Size(max = 280) String message) {
    }

    public record KudosDTO(
            Long id,
            String fromStudentId,
            String fromName,
            String toStudentId,
            String toName,
            String message,
            LocalDateTime createdAt) {
    }
}
