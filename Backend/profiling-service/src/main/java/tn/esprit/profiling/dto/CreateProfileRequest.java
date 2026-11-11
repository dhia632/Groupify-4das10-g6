package tn.esprit.profiling.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

public record CreateProfileRequest(
        @NotBlank String studentId,
        @DecimalMin("0.0") @DecimalMax("20.0") double gpa) {
}