package tn.esprit.gamification.messaging.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;
import java.util.List;

/** Contenu (payload) des événements consommés, publiés par les autres microservices. */
public final class InboundPayloads {

    private InboundPayloads() {
    }

    /** routing key : profile.completed (Profiling Service) */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ProfileCompleted(String studentId, String displayName, Instant completedAt) {
    }

    /** routing key : groups.published (Course / Group Service) */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GroupsPublished(Long courseId, List<PublishedGroup> groups) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PublishedGroup(Long groupId, String name, List<String> memberIds, int deliverablesTotal) {
    }

    /** routing key : contribution.recorded (Course / Group Service) */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ContributionRecorded(Long groupId, String studentId, String type, Instant recordedAt) {
    }

    /** routing key : deliverable.submitted (Course / Group Service) */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DeliverableSubmitted(Long groupId, Long deliverableId, Instant dueDate, Instant submittedAt) {
    }
}
