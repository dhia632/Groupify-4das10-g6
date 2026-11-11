package tn.esprit.microservicecours.repository;

import tn.esprit.microservicecours.entity.Projet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjetRepository extends JpaRepository<Projet, Long> {
    List<Projet> findByClasseId(Long classeId);
    List<Projet> findByModuleId(Long moduleId);
}