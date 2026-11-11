package tn.esprit.gamification.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Identité gamifiée d'un groupe. groupId / courseId référencent le Course / Group Service. */
@Entity
@Table(name = "team",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_team_group", columnNames = "group_id"),
                @UniqueConstraint(name = "uk_team_course_name", columnNames = {"course_id", "name"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(nullable = false, length = 60)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emblem_id")
    private Emblem emblem;

    private int totalPoints;

    private int deliverablesTotal;

    private int deliverablesSubmitted;

    private int onTimeDeliveries;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TeamMembership> memberships = new ArrayList<>();

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public double progressPercent() {
        if (deliverablesTotal <= 0) {
            return 0.0;
        }
        return Math.round(1000.0 * deliverablesSubmitted / deliverablesTotal) / 10.0;
    }

    public void rename(String newName) {
        this.name = newName.trim();
    }

    public void addPoints(int points) {
        this.totalPoints += points;
    }

    public void addMember(PlayerProfile player) {
        boolean already = memberships.stream()
                .anyMatch(m -> m.getPlayer().getStudentId().equals(player.getStudentId()));
        if (!already) {
            memberships.add(TeamMembership.builder()
                    .team(this)
                    .player(player)
                    .joinedAt(LocalDateTime.now())
                    .build());
        }
    }

    public boolean hasMember(String studentId) {
        return memberships.stream().anyMatch(m -> m.getPlayer().getStudentId().equals(studentId));
    }
}
