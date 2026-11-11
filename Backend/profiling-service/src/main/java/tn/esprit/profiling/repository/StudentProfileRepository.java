package tn.esprit.profiling.repository;

import tn.esprit.profiling.entity.ProfileStatus;
import tn.esprit.profiling.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
    Optional<StudentProfile> findByStudentId(String studentId);
    List<StudentProfile> findByStatus(ProfileStatus status);
}