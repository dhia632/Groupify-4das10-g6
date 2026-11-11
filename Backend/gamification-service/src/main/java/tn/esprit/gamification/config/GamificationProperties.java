package tn.esprit.gamification.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Paramètres lus depuis la section "gamification" de application.yml. */
@ConfigurationProperties(prefix = "gamification")
public record GamificationProperties(Rabbit rabbit, Rules rules) {

    public record Rabbit(String exchange,
                         String queue,
                         String deadLetterExchange,
                         String deadLetterQueue,
                         @DefaultValue("true") boolean publishEnabled) {
    }

    public record Rules(int contributionPoints,
                        int contributionDailyCap,
                        int profileCompletedPoints,
                        int groupJoinedPoints,
                        int deliverableOnTimePoints,
                        int deliverableLatePoints,
                        int kudosPoints,
                        int kudosWeeklyQuota,
                        int dailyActivityPoints) {
    }
}
