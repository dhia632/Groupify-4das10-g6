package tn.esprit.gamification.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.gamification.entity.Badge;
import tn.esprit.gamification.entity.BadgeAward;
import tn.esprit.gamification.entity.PlayerProfile;

import java.util.List;

public interface BadgeAwardRepository extends JpaRepository<BadgeAward, Long> {

    boolean existsByPlayerAndBadge(PlayerProfile player, Badge badge);

    @EntityGraph(attributePaths = "badge")
    List<BadgeAward> findByPlayerOrderByAwardedAtDesc(PlayerProfile player);

    long countByPlayer(PlayerProfile player);

    @Query("""
            select count(distinct a) from BadgeAward a, TeamMembership m
            where m.player = a.player and m.team.courseId = :courseId
            """)
    long countAwardsInCourse(@Param("courseId") Long courseId);
}
