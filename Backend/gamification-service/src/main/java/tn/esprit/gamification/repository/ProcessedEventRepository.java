package tn.esprit.gamification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.gamification.entity.ProcessedEvent;

public interface ProcessedEventRepository extends JpaRepository<ProcessedEvent, String> {
}
