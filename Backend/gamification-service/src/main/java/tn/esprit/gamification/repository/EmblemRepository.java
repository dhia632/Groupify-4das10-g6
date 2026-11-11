package tn.esprit.gamification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.gamification.entity.Emblem;

public interface EmblemRepository extends JpaRepository<Emblem, Long> {
}
