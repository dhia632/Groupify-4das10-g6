package tn.esprit.gamification.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Appel synchrone vers le Course / Group Service, résolu via Eureka (name = nom d'application Eureka).
 * Utilisé pour la réconciliation : un événement arrive pour un groupe que l'on ne connaît pas encore.
 */
@FeignClient(name = "course-group-service", fallbackFactory = GroupClientFallbackFactory.class)
public interface GroupClient {

    @GetMapping("/api/groups/{groupId}")
    GroupDTO getGroup(@PathVariable("groupId") Long groupId);
}
