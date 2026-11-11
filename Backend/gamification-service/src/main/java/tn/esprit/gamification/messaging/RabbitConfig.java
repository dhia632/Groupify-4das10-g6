package tn.esprit.gamification.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tn.esprit.gamification.config.GamificationProperties;

/**
 * Topologie RabbitMQ :
 *  - exchange topic "platform.events" partagé par tous les microservices ;
 *  - file durable "gamification.queue" abonnée aux événements utiles au service ;
 *  - Dead Letter Queue "gamification.dlq" pour les messages en échec après les tentatives.
 */
@Configuration
public class RabbitConfig {

    public static final String PROFILE_COMPLETED = "profile.completed";
    public static final String GROUPS_PUBLISHED = "groups.published";
    public static final String CONTRIBUTION_RECORDED = "contribution.recorded";
    public static final String DELIVERABLE_SUBMITTED = "deliverable.submitted";

    public static final String BADGE_AWARDED = "badge.awarded";
    public static final String LEVEL_UP = "level.up";
    public static final String TEAM_POINTS_UPDATED = "team.points.updated";

    private final GamificationProperties.Rabbit props;

    public RabbitConfig(GamificationProperties properties) {
        this.props = properties.rabbit();
    }

    @Bean
    public TopicExchange platformExchange() {
        return ExchangeBuilder.topicExchange(props.exchange()).durable(true).build();
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return ExchangeBuilder.directExchange(props.deadLetterExchange()).durable(true).build();
    }

    @Bean
    public Queue gamificationQueue() {
        return QueueBuilder.durable(props.queue())
                .deadLetterExchange(props.deadLetterExchange())
                .deadLetterRoutingKey(props.deadLetterQueue())
                .build();
    }

    @Bean
    public Queue gamificationDeadLetterQueue() {
        return QueueBuilder.durable(props.deadLetterQueue()).build();
    }

    @Bean
    public Declarables gamificationBindings(TopicExchange platformExchange, Queue gamificationQueue) {
        return new Declarables(
                BindingBuilder.bind(gamificationQueue).to(platformExchange).with(PROFILE_COMPLETED),
                BindingBuilder.bind(gamificationQueue).to(platformExchange).with(GROUPS_PUBLISHED),
                BindingBuilder.bind(gamificationQueue).to(platformExchange).with(CONTRIBUTION_RECORDED),
                BindingBuilder.bind(gamificationQueue).to(platformExchange).with(DELIVERABLE_SUBMITTED));
    }

    @Bean
    public Binding deadLetterBinding(DirectExchange deadLetterExchange, Queue gamificationDeadLetterQueue) {
        return BindingBuilder.bind(gamificationDeadLetterQueue).to(deadLetterExchange).with(props.deadLetterQueue());
    }

    /** JSON dans les deux sens ; le type cible est déduit de la signature du listener (pas du header __TypeId__). */
    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(objectMapper);
        converter.setAlwaysConvertToInferredType(true);
        return converter;
    }
}
