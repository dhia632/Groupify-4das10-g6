package tn.esprit.gamification;

import org.junit.jupiter.api.Test;
import tn.esprit.gamification.entity.BadgeRule;
import tn.esprit.gamification.entity.PlayerProfile;
import tn.esprit.gamification.entity.Team;
import tn.esprit.gamification.enums.ConditionType;
import tn.esprit.gamification.enums.EventType;
import tn.esprit.gamification.enums.RuleScope;

import static org.assertj.core.api.Assertions.assertThat;

/** Tests unitaires des règles métier portées par les entités (sans base ni Spring). */
class DomainRulesTest {

    @Test
    void firstOccurrenceRuleIsSatisfiedFromOneEvent() {
        BadgeRule rule = BadgeRule.builder()
                .triggerEvent(EventType.PROFILE_COMPLETED)
                .conditionType(ConditionType.FIRST_OCCURRENCE)
                .threshold(0)
                .scope(RuleScope.STUDENT)
                .build();
        assertThat(rule.isSatisfiedBy(0)).isFalse();
        assertThat(rule.isSatisfiedBy(1)).isTrue();
    }

    @Test
    void countThresholdRuleNeedsTheThreshold() {
        BadgeRule rule = BadgeRule.builder()
                .triggerEvent(EventType.KUDOS_RECEIVED)
                .conditionType(ConditionType.COUNT_THRESHOLD)
                .threshold(5)
                .scope(RuleScope.STUDENT)
                .build();
        assertThat(rule.isSatisfiedBy(4)).isFalse();
        assertThat(rule.isSatisfiedBy(5)).isTrue();
    }

    @Test
    void teamProgressIsAPercentage() {
        Team team = Team.builder().deliverablesTotal(4).deliverablesSubmitted(3).build();
        assertThat(team.progressPercent()).isEqualTo(75.0);
        assertThat(Team.builder().deliverablesTotal(0).build().progressPercent()).isZero();
    }

    @Test
    void teamDoesNotAddTheSameMemberTwice() {
        Team team = Team.builder().build();
        PlayerProfile p = PlayerProfile.builder().studentId("s1").build();
        team.addMember(p);
        team.addMember(p);
        assertThat(team.getMemberships()).hasSize(1);
        assertThat(team.hasMember("s1")).isTrue();
    }
}
