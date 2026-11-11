package tn.esprit.gamification.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** DTO des catalogues : avatars, emblèmes, niveaux. */
public final class CatalogDtos {

    private CatalogDtos() {
    }

    public record AvatarDTO(Long id, String code, String label, String imageUrl, int requiredLevel) {
    }

    public record AvatarRequest(
            @NotBlank @Size(max = 50) String code,
            @NotBlank @Size(max = 80) String label,
            @NotBlank String imageUrl,
            @Min(1) int requiredLevel) {
    }

    public record AvatarChoiceRequest(@NotNull Long avatarId) {
    }

    public record EmblemDTO(Long id, String code, String imageUrl) {
    }

    public record LevelDTO(int rank, String name, int minPoints) {
    }
}
