package tn.esprit.gamification.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.gamification.entity.BadgeRule;
import tn.esprit.gamification.enums.EventType;

import java.util.List;

public interface BadgeRuleRepository extends JpaRepository<BadgeRule, Long> {

    /** Règles actives déclenchées par un type d'événement. */
    @EntityGraph(attributePaths = "badge")
    List<BadgeRule> findByTriggerEventAndBadge_ActiveTrue(EventType triggerEvent);
}
