package tn.esprit.gamification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.gamification.entity.PlayerProfile;

import java.util.Optional;

public interface PlayerProfileRepository extends JpaRepository<PlayerProfile, Long> {

    Optional<PlayerProfile> findByStudentId(String studentId);
}
