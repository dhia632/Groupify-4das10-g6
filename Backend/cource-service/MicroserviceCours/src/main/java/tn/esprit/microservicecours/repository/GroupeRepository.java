package tn.esprit.microservicecours.repository;

import tn.esprit.microservicecours.entity.Groupe;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GroupeRepository extends JpaRepository<Groupe, Long> {
    List<Groupe> findByVersionId(Long versionId);
}