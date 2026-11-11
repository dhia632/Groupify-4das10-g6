package tn.esprit.microservicecours.repository;

import tn.esprit.microservicecours.entity.VersionGroupes;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface VersionGroupesRepository extends JpaRepository<VersionGroupes, Long> {
    List<VersionGroupes> findByDemandeIdOrderByNumeroAsc(Long demandeId);
    Optional<VersionGroupes> findTopByDemandeIdOrderByNumeroDesc(Long demandeId);
}