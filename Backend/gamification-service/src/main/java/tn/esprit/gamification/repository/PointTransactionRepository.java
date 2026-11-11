package tn.esprit.gamification.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.gamification.entity.PlayerProfile;
import tn.esprit.gamification.entity.PointTransaction;
import tn.esprit.gamification.enums.EventType;

import java.time.LocalDateTime;
import java.util.List;

public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {

    boolean existsByPlayerAndSourceEventId(PlayerProfile player, String sourceEventId);

    long countByPlayerAndReason(PlayerProfile player, EventType reason);

    Page<PointTransaction> findByPlayerOrderByCreatedAtDesc(PlayerProfile player, Pageable pageable);

    @Query("""
            select coalesce(sum(t.points), 0) from PointTransaction t
            where t.player = :player and t.reason = :reason and t.createdAt >= :since
            """)
    long sumPointsSince(@Param("player") PlayerProfile player,
                        @Param("reason") EventType reason,
                        @Param("since") LocalDateTime since);

    /** Répartition des contributions : points apportés à l'équipe par chaque membre. */
    @Query("""
            select t.player.studentId as studentId, coalesce(sum(t.points), 0) as points
            from PointTransaction t
            where t.team.id = :teamId
            group by t.player.studentId
            """)
    List<MemberPoints> sumPointsByMember(@Param("teamId") Long teamId);

    interface MemberPoints {
        String getStudentId();

        Long getPoints();
    }
}
