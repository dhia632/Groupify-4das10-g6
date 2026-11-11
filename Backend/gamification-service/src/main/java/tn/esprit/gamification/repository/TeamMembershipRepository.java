package tn.esprit.gamification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.gamification.entity.Team;
import tn.esprit.gamification.entity.TeamMembership;

import java.time.LocalDateTime;
import java.util.List;

public interface TeamMembershipRepository extends JpaRepository<TeamMembership, Long> {

    List<TeamMembership> findByPlayer_StudentIdOrderByJoinedAtDesc(String studentId);

    /** Équipes communes à deux étudiants (pour autoriser un kudos). */
    @Query("""
            select m1.team from TeamMembership m1, TeamMembership m2
            where m1.team = m2.team
              and m1.player.studentId = :a
              and m2.player.studentId = :b
            """)
    List<Team> findCommonTeams(@Param("a") String studentA, @Param("b") String studentB);

    @Query("select count(distinct m.player) from TeamMembership m where m.team.courseId = :courseId")
    long countPlayersInCourse(@Param("courseId") Long courseId);

    @Query("""
            select count(distinct m.player) from TeamMembership m
            where m.team.courseId = :courseId and m.player.lastActivityAt >= :since
            """)
    long countActivePlayersInCourse(@Param("courseId") Long courseId, @Param("since") LocalDateTime since);
}
