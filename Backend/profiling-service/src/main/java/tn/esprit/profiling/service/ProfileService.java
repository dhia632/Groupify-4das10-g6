package tn.esprit.profiling.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import tn.esprit.profiling.dto.CreateProfileRequest;
import tn.esprit.profiling.dto.ProfileResponse;
import tn.esprit.profiling.entity.ProfileStatus;
import tn.esprit.profiling.entity.StudentProfile;
import tn.esprit.profiling.exception.ProfileAlreadyExistsException;
import tn.esprit.profiling.exception.ProfileNotFoundException;
import tn.esprit.profiling.repository.StudentProfileRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final StudentProfileRepository repository;

    public ProfileResponse create(CreateProfileRequest request) {
        if (repository.findByStudentId(request.studentId()).isPresent()) {
            throw new ProfileAlreadyExistsException(request.studentId());
        }
        StudentProfile profile = new StudentProfile();
        profile.setStudentId(request.studentId());
        profile.setGpa(request.gpa());
        profile.setStatus(ProfileStatus.IN_PROGRESS);
        profile.setCompletionRate(25);          // le GPA est renseigné : 1 élément sur 4
        profile.setUpdatedAt(LocalDateTime.now());
        return ProfileResponse.from(repository.save(profile));
    }

    public ProfileResponse findByStudentId(String studentId) {
        return repository.findByStudentId(studentId)
                .map(ProfileResponse::from)
                .orElseThrow(() -> new ProfileNotFoundException(studentId));
    }

    public Page<ProfileResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(ProfileResponse::from);
    }

    public void delete(String studentId) {
        StudentProfile profile = repository.findByStudentId(studentId)
                .orElseThrow(() -> new ProfileNotFoundException(studentId));
        repository.delete(profile);
    }
}