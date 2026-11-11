package tn.esprit.profiling.dto;

import tn.esprit.profiling.entity.ProfileStatus;
import tn.esprit.profiling.entity.StudentProfile;
import java.time.LocalDateTime;

public record ProfileResponse(
        Long id,
        String studentId,
        double gpa,
        ProfileStatus status,
        int completionRate,
        LocalDateTime updatedAt) {

    public static ProfileResponse from(StudentProfile p) {
        return new ProfileResponse(p.getId(), p.getStudentId(), p.getGpa(),
                p.getStatus(), p.getCompletionRate(), p.getUpdatedAt());
    }
}