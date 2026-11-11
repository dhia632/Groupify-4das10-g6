package tn.esprit.microservicecours.repository;

import tn.esprit.microservicecours.entity.AjustementManuel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AjustementManuelRepository extends JpaRepository<AjustementManuel, Long> {
    List<AjustementManuel> findByVersionId(Long versionId);
}