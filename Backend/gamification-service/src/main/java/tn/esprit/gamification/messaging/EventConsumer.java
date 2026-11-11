package tn.esprit.gamification.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import tn.esprit.gamification.messaging.event.PlatformEvent;
import tn.esprit.gamification.service.EventProcessingService;

/**
 * Point d'entrée asynchrone. En cas d'exception, Spring AMQP retente 3 fois (application.yml)
 * puis rejette le message, qui part dans la Dead Letter Queue.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EventConsumer {

    private final EventProcessingService processingService;

    @RabbitListener(queues = "${gamification.rabbit.queue}")
    public void onEvent(PlatformEvent event, @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
        log.info("Événement reçu [{}] id={}", routingKey, event.eventId());
        processingService.handle(routingKey, event);
    }
}
