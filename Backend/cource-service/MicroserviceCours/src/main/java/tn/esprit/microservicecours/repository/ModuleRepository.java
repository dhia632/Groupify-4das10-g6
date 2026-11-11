package tn.esprit.microservicecours.repository;

import tn.esprit.microservicecours.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModuleRepository extends JpaRepository<Module, Long> {
}