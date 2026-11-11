package tn.esprit.microservicecours.repository;

import tn.esprit.microservicecours.entity.DemandeConstitution;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DemandeConstitutionRepository extends JpaRepository<DemandeConstitution, Long> {
    List<DemandeConstitution> findByProjetId(Long projetId);
}