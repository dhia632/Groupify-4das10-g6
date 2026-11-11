package tn.esprit.gamification.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Un badge n'est obtenu qu'une seule fois par joueur : contrainte UNIQUE(player_id, badge_id). */
@Entity
@Table(name = "badge_award",
        uniqueConstraints = @UniqueConstraint(name = "uk_award_player_badge", columnNames = {"player_id", "badge_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BadgeAward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_id")
    private PlayerProfile player;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "badge_id")
    private Badge badge;

    @Column(nullable = false)
    private LocalDateTime awardedAt;

    @Column(length = 100)
    private String sourceEventId;

    private boolean manual;

    /** studentId de l'enseignant pour une attribution manuelle. */
    @Column(length = 64)
    private String awardedBy;
}
