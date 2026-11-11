package tn.esprit.gamification.entity;

import jakarta.persistence.*;
import lombok.*;

/** Palier de points. Table "levels" et colonne "level_rank" car LEVEL et RANK sont des mots-clés MySQL. */
@Entity
@Table(name = "levels")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Level {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "level_rank", nullable = false, unique = true)
    private int rank;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false)
    private int minPoints;
}
