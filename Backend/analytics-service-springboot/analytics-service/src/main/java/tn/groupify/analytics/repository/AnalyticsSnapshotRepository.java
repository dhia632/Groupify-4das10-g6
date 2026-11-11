package tn.groupify.analytics.repository;

import tn.groupify.analytics.model.AnalyticsSnapshot;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface AnalyticsSnapshotRepository extends MongoRepository<AnalyticsSnapshot, String> {
    Optional<AnalyticsSnapshot> findByCourseId(int courseId);
    Optional<AnalyticsSnapshot> findByPromotionId(String promotionId);
}
