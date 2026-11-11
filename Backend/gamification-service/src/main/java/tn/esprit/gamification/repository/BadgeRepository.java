package tn.esprit.gamification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.gamification.entity.Badge;
import tn.esprit.gamification.enums.RuleScope;

import java.util.List;

public interface BadgeRepository extends JpaRepository<Badge, Long> {

    boolean existsByCode(String code);

    List<Badge> findByActiveTrueOrderByCategoryAscNameAsc();

    /** Badges "d'équipe" (règle de portée TEAM) détenus par les membres d'une équipe. */
    @Query("""
            select distinct b from BadgeAward a
              join a.badge b
              join b.rules r,
              TeamMembership m
            where m.team.id = :teamId
              and m.player = a.player
              and r.scope = :scope
            """)
    List<Badge> findTeamBadges(@Param("teamId") Long teamId, @Param("scope") RuleScope scope);
}
