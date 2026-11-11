package tn.esprit.gamification.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Remerciement d'entraide entre deux membres d'une même équipe. */
@Entity
@Table(name = "kudos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Kudos {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id")
    private PlayerProfile sender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_id")
    private PlayerProfile receiver;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(length = 280)
    private String message;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
