package tn.esprit.gamification.entity;

import jakarta.persistence.*;
import lombok.*;
import tn.esprit.gamification.enums.BadgeCategory;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "badge")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 500)
    private String description;

    private String iconUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BadgeCategory category;

    /** Points bonus gagnés à l'obtention du badge. */
    private int rewardPoints;

    private boolean active;

    @OneToMany(mappedBy = "badge", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<BadgeRule> rules = new ArrayList<>();

    public void addRule(BadgeRule rule) {
        rule.setBadge(this);
        this.rules.add(rule);
    }

    public void replaceRules(List<BadgeRule> newRules) {
        this.rules.clear();
        newRules.forEach(this::addRule);
    }
}
