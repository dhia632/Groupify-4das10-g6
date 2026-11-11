package tn.esprit.gamification.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;
import tn.esprit.gamification.exception.ApiException;

/**
 * Comportement si le Course / Group Service est indisponible (circuit ouvert, timeout, erreur) :
 * on lève une exception récupérable. Côté RabbitMQ, le message est retenté puis envoyé en DLQ,
 * il n'est donc jamais perdu.
 */
@Slf4j
@Component
public class GroupClientFallbackFactory implements FallbackFactory<GroupClient> {

    @Override
    public GroupClient create(Throwable cause) {
        return groupId -> {
            log.warn("course-group-service indisponible pour le groupe {} : {}", groupId, cause.toString());
            throw ApiException.unavailable("Course / Group Service indisponible, réessayez plus tard");
        };
    }
}
