package tn.esprit.gamification.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.gamification.entity.Team;

import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {

    Optional<Team> findByGroupId(Long groupId);

    boolean existsByCourseIdAndNameIgnoreCase(Long courseId, String name);

    boolean existsByCourseIdAndNameIgnoreCaseAndIdNot(Long courseId, String name, Long id);

    Page<Team> findByCourseIdOrderByTotalPointsDescNameAsc(Long courseId, Pageable pageable);

    long countByCourseId(Long courseId);

    @Query("select coalesce(avg(t.totalPoints), 0.0) from Team t where t.courseId = :courseId")
    double averagePointsInCourse(@Param("courseId") Long courseId);
}
