package tn.esprit.profiling.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class SkillScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    private SkillType skill;
    private int selfScore;          // 1 à 5
    private Integer adjustedScore;  // ajusté par l'enseignant (peut être null)
    @ManyToOne @JoinColumn(name = "profile_id")
    private StudentProfile profile;
}

