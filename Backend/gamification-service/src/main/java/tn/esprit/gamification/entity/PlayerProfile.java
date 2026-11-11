package tn.esprit.gamification.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Profil de jeu d'un étudiant. studentId = "sub" du JWT Keycloak (référence externe, pas de clé étrangère). */
@Entity
@Table(name = "player_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String studentId;

    @Column(length = 120)
    private String displayName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avatar_id")
    private Avatar avatar;

    private int totalPoints;

    private int currentStreakDays;

    private LocalDateTime lastActivityAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public void addPoints(int points) {
        this.totalPoints += points;
    }
}
