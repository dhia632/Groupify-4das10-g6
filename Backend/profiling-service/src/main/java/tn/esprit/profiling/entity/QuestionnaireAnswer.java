package tn.esprit.profiling.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class QuestionnaireAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String questionCode;
    @Column(name = "answer_value")
    private int value;
    @ManyToOne
    @JoinColumn(name = "profile_id")
    private StudentProfile profile;
}
