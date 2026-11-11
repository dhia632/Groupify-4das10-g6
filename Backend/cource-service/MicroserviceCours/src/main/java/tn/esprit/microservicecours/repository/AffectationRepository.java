package tn.esprit.microservicecours.repository;

import tn.esprit.microservicecours.entity.Affectation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface AffectationRepository extends JpaRepository<Affectation, Long> {
    List<Affectation> findByGroupeId(Long groupeId);
    Optional<Affectation> findByGroupeVersionIdAndEtudiantId(Long versionId, Long etudiantId);
}