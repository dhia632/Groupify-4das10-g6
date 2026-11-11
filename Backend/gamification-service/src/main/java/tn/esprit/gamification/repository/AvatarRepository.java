package tn.esprit.gamification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.gamification.entity.Avatar;

import java.util.List;

public interface AvatarRepository extends JpaRepository<Avatar, Long> {

    List<Avatar> findByActiveTrueOrderByRequiredLevelAsc();

    boolean existsByCode(String code);
}
