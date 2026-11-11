package tn.groupify.analytics.config;

import tn.groupify.analytics.model.AnalyticsSnapshot;
import tn.groupify.analytics.model.AnalyticsReport;
import tn.groupify.analytics.repository.AnalyticsSnapshotRepository;
import tn.groupify.analytics.repository.AnalyticsReportRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Configuration
@Profile("local")
public class DemoDataInitializer {
    @Bean
    CommandLineRunner seedDemoData(AnalyticsSnapshotRepository snapshots, AnalyticsReportRepository reports) {
        return args -> {
            if (snapshots.findByCourseId(1).isPresent()) return;
            AnalyticsSnapshot s = new AnalyticsSnapshot();
            s.setId("demo-4das");
            s.setCourseId(1);
            s.setProjectId(1);
            s.setPromotionId("4DAS");
            s.setPromotionLabel("Promotion 4DAS 2026-2027");
            s.setStudentsCount(24);
            s.setCoursesCount(3);
            List<AnalyticsSnapshot.StudentData> students = new java.util.ArrayList<>();
            for (int i = 1; i <= 24; i++) {
                AnalyticsSnapshot.StudentData st = new AnalyticsSnapshot.StudentData();
                st.setStudentId("student" + i);
                st.setDisplayName("Étudiant " + i);
                st.setGpa(10.0 + ((i * 7) % 80) / 10.0);
                st.setClassName(i <= 16 ? "4DAS1" : "4DAS2");
                st.setSkills(List.of((i % 5) + 1, ((i + 1) % 5) + 1, ((i + 2) % 5) + 1, ((i + 3) % 5) + 1, ((i + 4) % 5) + 1));
                students.add(st);
            }
            s.setStudents(students);
            List<AnalyticsSnapshot.GroupData> groups = new java.util.ArrayList<>();
            for (int g = 0; g < 6; g++) {
                AnalyticsSnapshot.GroupData group = new AnalyticsSnapshot.GroupData();
                group.setGroupId(g + 1);
                group.setName("Groupe " + (g + 1));
                group.setMemberIds(List.of("student" + (g * 4 + 1), "student" + (g * 4 + 2), "student" + (g * 4 + 3), "student" + (g * 4 + 4)));
                group.setPoints(120 + g * 17);
                group.setBadges(2 + g % 4);
                group.setDeliverablesTotal(3);
                group.setDeliverablesOnTime(2 + g % 2);
                groups.add(group);
            }
            s.setGroups(groups);
            List<AnalyticsSnapshot.ContributionData> contributions = new java.util.ArrayList<>();
            for (int i = 1; i <= 24; i++) {
                for (int j = 0; j < 4; j++) {
                    AnalyticsSnapshot.ContributionData c = new AnalyticsSnapshot.ContributionData();
                    c.setStudentId("student" + i);
                    c.setGroupId(((i - 1) / 4) + 1);
                    c.setPoints(3 + ((i + j) % 8));
                    c.setRecordedAt(Instant.now().minus(j * 2L + (i % 5), ChronoUnit.DAYS).toString());
                    contributions.add(c);
                }
            }
            s.setContributions(contributions);
            AnalyticsSnapshot.ClassData c1 = new AnalyticsSnapshot.ClassData();
            c1.setClassName("4DAS1"); c1.setGroups(4); c1.setGpaStdDev(1.2); c1.setActiveRate(82);
            AnalyticsSnapshot.ClassData c2 = new AnalyticsSnapshot.ClassData();
            c2.setClassName("4DAS2"); c2.setGroups(2); c2.setGpaStdDev(1.5); c2.setActiveRate(74);
            s.setClasses(List.of(c1, c2));
            snapshots.save(s);

            if (reports.count() == 0) {
                AnalyticsReport r1 = new AnalyticsReport();
                r1.setScope("COURSE"); r1.setScopeId("1"); r1.setPeriod("Semaine 4");
                r1.setStatus("READY"); r1.setGeneratedAt(Instant.now().minus(2, ChronoUnit.DAYS).toString());
                reports.save(r1);
                AnalyticsReport r2 = new AnalyticsReport();
                r2.setScope("PROMOTION"); r2.setScopeId("4DAS"); r2.setPeriod("Novembre 2026");
                r2.setStatus("READY"); r2.setGeneratedAt(Instant.now().minus(1, ChronoUnit.DAYS).toString());
                reports.save(r2);
            }
            System.out.println(">>> Données de démonstration Analytics créées.");
        };
    }
}
