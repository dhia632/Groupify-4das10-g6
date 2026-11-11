package tn.esprit.gamification.mapper;

import org.springframework.stereotype.Component;
import tn.esprit.gamification.dto.BadgeDtos.BadgeAwardDTO;
import tn.esprit.gamification.dto.BadgeDtos.BadgeDTO;
import tn.esprit.gamification.dto.BadgeDtos.BadgeRuleDTO;
import tn.esprit.gamification.dto.CatalogDtos.AvatarDTO;
import tn.esprit.gamification.dto.CatalogDtos.EmblemDTO;
import tn.esprit.gamification.dto.CatalogDtos.LevelDTO;
import tn.esprit.gamification.dto.PlayerDtos.PointTransactionDTO;
import tn.esprit.gamification.dto.TeamDtos.KudosDTO;
import tn.esprit.gamification.dto.TeamDtos.TeamDTO;
import tn.esprit.gamification.entity.*;

/** Conversion entités -> DTO (les entités ne sortent jamais du service). */
@Component
public class GamificationMapper {

    public AvatarDTO toDto(Avatar a) {
        return a == null ? null : new AvatarDTO(a.getId(), a.getCode(), a.getLabel(), a.getImageUrl(), a.getRequiredLevel());
    }

    public EmblemDTO toDto(Emblem e) {
        return e == null ? null : new EmblemDTO(e.getId(), e.getCode(), e.getImageUrl());
    }

    public LevelDTO toDto(Level l) {
        return l == null ? null : new LevelDTO(l.getRank(), l.getName(), l.getMinPoints());
    }

    public BadgeRuleDTO toDto(BadgeRule r) {
        return new BadgeRuleDTO(r.getTriggerEvent(), r.getConditionType(), r.getThreshold(), r.getScope());
    }

    public BadgeDTO toDto(Badge b) {
        return new BadgeDTO(b.getId(), b.getCode(), b.getName(), b.getDescription(), b.getIconUrl(),
                b.getCategory(), b.getRewardPoints(), b.isActive(),
                b.getRules().stream().map(this::toDto).toList());
    }

    public BadgeAwardDTO toDto(BadgeAward a) {
        return new BadgeAwardDTO(toDto(a.getBadge()), a.getAwardedAt(), a.isManual());
    }

    public PointTransactionDTO toDto(PointTransaction t) {
        return new PointTransactionDTO(t.getPoints(), t.getReason(), t.getSourceEventId(), t.getCreatedAt());
    }

    public TeamDTO toDto(Team t) {
        return new TeamDTO(t.getId(), t.getGroupId(), t.getCourseId(), t.getName(), toDto(t.getEmblem()),
                t.getTotalPoints(), t.progressPercent(),
                t.getMemberships().stream().map(m -> m.getPlayer().getStudentId()).toList());
    }

    public KudosDTO toDto(Kudos k) {
        return new KudosDTO(k.getId(),
                k.getSender().getStudentId(), k.getSender().getDisplayName(),
                k.getReceiver().getStudentId(), k.getReceiver().getDisplayName(),
                k.getMessage(), k.getCreatedAt());
    }

    public BadgeRule toEntity(BadgeRuleDTO dto) {
        return BadgeRule.builder()
                .triggerEvent(dto.triggerEvent())
                .conditionType(dto.conditionType())
                .threshold(dto.threshold())
                .scope(dto.scope())
                .build();
    }
}
