package tn.esprit.gamification.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.gamification.entity.Kudos;
import tn.esprit.gamification.entity.PlayerProfile;

import java.time.LocalDateTime;
import java.util.List;

public interface KudosRepository extends JpaRepository<Kudos, Long> {

    long countBySenderAndCreatedAtAfter(PlayerProfile sender, LocalDateTime since);

    @EntityGraph(attributePaths = {"sender", "receiver"})
    List<Kudos> findByTeam_IdOrderByCreatedAtDesc(Long teamId);
}
