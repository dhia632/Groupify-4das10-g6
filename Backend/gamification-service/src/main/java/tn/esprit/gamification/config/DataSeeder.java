package tn.esprit.gamification.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.gamification.entity.*;
import tn.esprit.gamification.enums.BadgeCategory;
import tn.esprit.gamification.enums.ConditionType;
import tn.esprit.gamification.enums.EventType;
import tn.esprit.gamification.enums.RuleScope;
import tn.esprit.gamification.repository.AvatarRepository;
import tn.esprit.gamification.repository.BadgeRepository;
import tn.esprit.gamification.repository.EmblemRepository;
import tn.esprit.gamification.repository.LevelRepository;

import java.util.List;

/** Données de référence insérées au premier démarrage (tables vides uniquement). */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final LevelRepository levelRepository;
    private final AvatarRepository avatarRepository;
    private final EmblemRepository emblemRepository;
    private final BadgeRepository badgeRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (levelRepository.count() == 0) {
            levelRepository.saveAll(List.of(
                    level(1, "Débutant", 0),
                    level(2, "Contributeur", 100),
                    level(3, "Collaborateur", 250),
                    level(4, "Pilier", 500),
                    level(5, "Mentor", 1000)));
            log.info("Niveaux initialisés");
        }

        if (avatarRepository.count() == 0) {
            avatarRepository.saveAll(List.of(
                    avatar("FOX", "Renard", 1),
                    avatar("OWL", "Hibou", 1),
                    avatar("CAT", "Chat", 1),
                    avatar("PANDA", "Panda", 1),
                    avatar("ROBOT", "Robot", 2),
                    avatar("ASTRONAUT", "Astronaute", 3),
                    avatar("DRAGON", "Dragon", 4),
                    avatar("PHOENIX", "Phénix", 5)));
            log.info("Avatars initialisés");
        }

        if (emblemRepository.count() == 0) {
            emblemRepository.saveAll(List.of(
                    emblem("ROCKET"), emblem("LIGHTNING"), emblem("TREE"),
                    emblem("SHIELD"), emblem("STAR"), emblem("WAVE")));
            log.info("Emblèmes initialisés");
        }

        if (badgeRepository.count() == 0) {
            badgeRepository.saveAll(List.of(
                    badge("PROFILE_DONE", "Profil complété", "A complété son profil d'apprentissage",
                            BadgeCategory.PARTICIPATION, 10,
                            EventType.PROFILE_COMPLETED, ConditionType.FIRST_OCCURRENCE, 1, RuleScope.STUDENT),
                    badge("FIRST_STEP", "Première contribution", "Première contribution au projet de l'équipe",
                            BadgeCategory.PARTICIPATION, 10,
                            EventType.CONTRIBUTION_RECORDED, ConditionType.FIRST_OCCURRENCE, 1, RuleScope.STUDENT),
                    badge("ON_TIME", "Livrable à l'heure", "L'équipe a rendu un livrable avant l'échéance",
                            BadgeCategory.DELIVERY, 15,
                            EventType.DELIVERABLE_SUBMITTED, ConditionType.ON_TIME, 1, RuleScope.TEAM),
                    badge("HELPER", "Entraide", "A reçu 5 kudos de ses coéquipiers",
                            BadgeCategory.COOPERATION, 25,
                            EventType.KUDOS_RECEIVED, ConditionType.COUNT_THRESHOLD, 5, RuleScope.STUDENT),
                    badge("REGULAR", "Régularité", "Actif 7 jours d'affilée",
                            BadgeCategory.REGULARITY, 25,
                            EventType.DAILY_ACTIVITY, ConditionType.STREAK_DAYS, 7, RuleScope.STUDENT),
                    badge("DREAM_TEAM", "Équipe exemplaire", "3 livrables rendus à temps",
                            BadgeCategory.COOPERATION, 40,
                            EventType.DELIVERABLE_SUBMITTED, ConditionType.ON_TIME, 3, RuleScope.TEAM)));
            log.info("Badges initialisés");
        }
    }

    private static Level level(int rank, String name, int min) {
        return Level.builder().rank(rank).name(name).minPoints(min).build();
    }

    private static Avatar avatar(String code, String label, int requiredLevel) {
        return Avatar.builder()
                .code(code)
                .label(label)
                .imageUrl("/assets/avatars/" + code.toLowerCase() + ".png")
                .requiredLevel(requiredLevel)
                .active(true)
                .build();
    }

    private static Emblem emblem(String code) {
        return Emblem.builder().code(code).imageUrl("/assets/emblems/" + code.toLowerCase() + ".png").build();
    }

    private static Badge badge(String code, String name, String description, BadgeCategory category, int reward,
                               EventType trigger, ConditionType condition, int threshold, RuleScope scope) {
        Badge badge = Badge.builder()
                .code(code)
                .name(name)
                .description(description)
                .iconUrl("/assets/badges/" + code.toLowerCase() + ".png")
                .category(category)
                .rewardPoints(reward)
                .active(true)
                .build();
        badge.addRule(BadgeRule.builder()
                .triggerEvent(trigger)
                .conditionType(condition)
                .threshold(threshold)
                .scope(scope)
                .build());
        return badge;
    }
}
