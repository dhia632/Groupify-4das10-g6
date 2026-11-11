package tn.esprit.gamification.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "avatar")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Avatar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 80)
    private String label;

    @Column(nullable = false)
    private String imageUrl;

    /** Rang de niveau minimal pour pouvoir choisir cet avatar. */
    private int requiredLevel;

    private boolean active;
}
