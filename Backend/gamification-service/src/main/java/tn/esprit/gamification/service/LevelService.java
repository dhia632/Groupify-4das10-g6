package tn.esprit.gamification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.gamification.entity.Level;
import tn.esprit.gamification.repository.LevelRepository;

import java.util.List;
import java.util.Optional;

/** Le niveau n'est pas stocké : il est calculé à partir du total de points. */
@Service
@RequiredArgsConstructor
public class LevelService {

    private static final Level DEFAULT_LEVEL = Level.builder().rank(1).name("Débutant").minPoints(0).build();

    private final LevelRepository levelRepository;

    public Level levelFor(int points) {
        return levelRepository.findTopByMinPointsLessThanEqualOrderByMinPointsDesc(points).orElse(DEFAULT_LEVEL);
    }

    public Optional<Level> nextLevel(int points) {
        return levelRepository.findFirstByMinPointsGreaterThanOrderByMinPointsAsc(points);
    }

    /** Progression vers le niveau suivant, entre 0 et 1 (1 si niveau maximum). */
    public double progressToNextLevel(int points) {
        Level current = levelFor(points);
        return nextLevel(points)
                .map(next -> {
                    double span = next.getMinPoints() - current.getMinPoints();
                    double done = points - current.getMinPoints();
                    return Math.round(100.0 * done / span) / 100.0;
                })
                .orElse(1.0);
    }

    public List<Level> findAll() {
        return levelRepository.findAllByOrderByMinPointsAsc();
    }
}
