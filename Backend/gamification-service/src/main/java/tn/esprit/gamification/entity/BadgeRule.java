package tn.esprit.gamification.entity;

import jakarta.persistence.*;
import lombok.*;
import tn.esprit.gamification.enums.ConditionType;
import tn.esprit.gamification.enums.EventType;
import tn.esprit.gamification.enums.RuleScope;

@Entity
@Table(name = "badge_rule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BadgeRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "badge_id")
    private Badge badge;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EventType triggerEvent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ConditionType conditionType;

    private int threshold;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RuleScope scope;

    public boolean isSatisfiedBy(int counter) {
        int min = conditionType == ConditionType.FIRST_OCCURRENCE ? 1 : threshold;
        return counter >= min;
    }
}
