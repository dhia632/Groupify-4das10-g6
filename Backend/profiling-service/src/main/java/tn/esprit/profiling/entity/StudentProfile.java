package tn.esprit.profiling.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class StudentProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String studentId;

    private double gpa;

    @Enumerated(EnumType.STRING)
    private ProfileStatus status = ProfileStatus.EMPTY;

    private int completionRate;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SkillScore> skills = new ArrayList<>();

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "learning_style_id")
    private LearningStyle learningStyle;

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Interest> interests = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuestionnaireAnswer> answers = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "csv_import_id")
    private CsvImport csvImport;

    public boolean isComplete() {
        return gpa > 0 && skills.size() == SkillType.values().length && learningStyle != null;
    }
}