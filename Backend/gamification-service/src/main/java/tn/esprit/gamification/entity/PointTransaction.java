package tn.esprit.gamification.entity;

import jakarta.persistence.*;
import lombok.*;
import tn.esprit.gamification.enums.EventType;

import java.time.LocalDateTime;

/**
 * Journal des points (ledger). Chaque gain est tracé et explicable.
 * UNIQUE(player_id, source_event_id) : un même événement ne crédite jamais deux fois le même joueur.
 */
@Entity
@Table(name = "point_transaction",
        uniqueConstraints = @UniqueConstraint(name = "uk_tx_player_event", columnNames = {"player_id", "source_event_id"}),
        indexes = @Index(name = "idx_tx_team", columnList = "team_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_id")
    private PlayerProfile player;

    /** Équipe créditée (null pour un gain purement individuel). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    private int points;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EventType reason;

    @Column(name = "source_event_id", nullable = false, length = 100)
    private String sourceEventId;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
