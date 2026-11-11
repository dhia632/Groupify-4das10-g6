package tn.esprit.gamification.enums;

/** Façon dont le compteur d'une règle de badge est calculé. */
public enum ConditionType {
    /** Premier événement de ce type. */
    FIRST_OCCURRENCE,
    /** Nombre d'événements de ce type >= seuil. */
    COUNT_THRESHOLD,
    /** Nombre de jours d'activité consécutifs >= seuil. */
    STREAK_DAYS,
    /** Nombre de livrables rendus à temps >= seuil. */
    ON_TIME
}
