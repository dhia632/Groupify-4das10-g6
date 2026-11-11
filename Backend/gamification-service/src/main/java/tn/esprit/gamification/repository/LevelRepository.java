package tn.esprit.gamification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.gamification.entity.Level;

import java.util.List;
import java.util.Optional;

public interface LevelRepository extends JpaRepository<Level, Long> {

    List<Level> findAllByOrderByMinPointsAsc();

    /** Niveau courant : le palier le plus haut dont le minimum est atteint. */
    Optional<Level> findTopByMinPointsLessThanEqualOrderByMinPointsDesc(int points);

    /** Niveau suivant : le premier palier au-dessus du total actuel. */
    Optional<Level> findFirstByMinPointsGreaterThanOrderByMinPointsAsc(int points);
}
