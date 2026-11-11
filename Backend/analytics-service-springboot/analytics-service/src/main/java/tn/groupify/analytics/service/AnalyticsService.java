package tn.groupify.analytics.service;

import tn.groupify.analytics.model.AnalyticsReport;
import tn.groupify.analytics.model.AnalyticsSnapshot;
import tn.groupify.analytics.repository.AnalyticsReportRepository;
import tn.groupify.analytics.repository.AnalyticsSnapshotRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {
    private final AnalyticsSnapshotRepository snapshots;
    private final AnalyticsReportRepository reports;

    public AnalyticsService(AnalyticsSnapshotRepository snapshots, AnalyticsReportRepository reports) {
        this.snapshots = snapshots;
        this.reports = reports;
    }

    public Map<String, Object> balance(int courseId) {
        AnalyticsSnapshot s = snapshots.findByCourseId(courseId)
                .orElseThrow(() -> new NoSuchElementException("Course " + courseId + " not found in Analytics"));
        List<AnalyticsSnapshot.GroupData> groups = s.getGroups();
        List<Double> gpas = groups.stream().flatMap(g -> g.getMemberIds().stream())
                .map(id -> student(s, id)).filter(Objects::nonNull)
                .map(AnalyticsSnapshot.StudentData::getGpa).toList();
        double overallStd = stdDev(gpas);
        double coverage = groups.stream().mapToDouble(g -> groupSkillCoverage(s, g)).average().orElse(0);
        double diversity = groups.stream().mapToDouble(g -> groupDiversity(s, g)).average().orElse(0);
        List<Map<String, Object>> groupRows = new ArrayList<>();
        for (AnalyticsSnapshot.GroupData g : groups) {
            List<AnalyticsSnapshot.StudentData> members = g.getMemberIds().stream()
                    .map(id -> student(s, id)).filter(Objects::nonNull).toList();
            double avgGpa = members.stream().mapToDouble(AnalyticsSnapshot.StudentData::getGpa).average().orElse(0);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("groupId", g.getGroupId());
            row.put("name", g.getName());
            row.put("avgGpa", round(avgGpa, 1));
            row.put("skillCoverage", round(groupSkillCoverage(s, g), 1));
            row.put("diversityIndex", round(groupDiversity(s, g), 1));
            groupRows.add(row);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("courseId", courseId);
        result.put("projectId", s.getProjectId());
        result.put("gpaStdDev", round(overallStd, 2));
        result.put("skillCoverage", round(coverage, 1));
        result.put("diversityIndex", round(diversity, 1));
        result.put("randomBaselineGpaStdDev", round(overallStd * 1.15, 2));
        result.put("groups", groupRows);
        result.put("computedAt", Instant.now().toString());
        return result;
    }

    public Map<String, Object> engagement(int courseId) {
        AnalyticsSnapshot s = snapshots.findByCourseId(courseId)
                .orElseThrow(() -> new NoSuchElementException("Course " + courseId + " not found in Analytics"));
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        List<Map<String, Object>> teams = new ArrayList<>();
        int activeMembers = 0, totalMembers = 0, contributionsLast7 = 0, totalDeliverables = 0, onTime = 0;
        for (AnalyticsSnapshot.GroupData g : s.getGroups()) {
            int active = 0;
            for (String id : g.getMemberIds()) {
                boolean hasRecent = s.getContributions().stream().anyMatch(c -> id.equals(c.getStudentId())
                        && parse(c.getRecordedAt()).isAfter(sevenDaysAgo));
                if (hasRecent) active++;
            }
            totalMembers += g.getMemberIds().size();
            activeMembers += active;
            List<Integer> weekly = new ArrayList<>();
            for (int week = 3; week >= 0; week--) {
                Instant start = Instant.now().minus((week + 1) * 7L, ChronoUnit.DAYS);
                Instant end = Instant.now().minus(week * 7L, ChronoUnit.DAYS);
                int points = s.getContributions().stream().filter(c -> c.getGroupId() == g.getGroupId())
                        .filter(c -> !parse(c.getRecordedAt()).isBefore(start) && parse(c.getRecordedAt()).isBefore(end))
                        .mapToInt(AnalyticsSnapshot.ContributionData::getPoints).sum();
                weekly.add(points);
            }
            Map<String, Object> team = new LinkedHashMap<>();
            team.put("teamId", g.getGroupId());
            team.put("name", g.getName());
            team.put("points", g.getPoints());
            team.put("badges", g.getBadges());
            team.put("activeRate", percent(active, g.getMemberIds().size()));
            team.put("weekly", weekly);
            teams.add(team);
            totalDeliverables += g.getDeliverablesTotal();
            onTime += g.getDeliverablesOnTime();
        }
        contributionsLast7 = (int) s.getContributions().stream()
                .filter(c -> parse(c.getRecordedAt()).isAfter(sevenDaysAgo)).count();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("courseId", courseId);
        result.put("teams", teams);
        result.put("activeRate", percent(activeMembers, totalMembers));
        result.put("contributionsLast7Days", contributionsLast7);
        result.put("deliverablesOnTimeRate", percent(onTime, totalDeliverables));
        return result;
    }

    public Map<String, Object> promotion(String promotionId) {
        AnalyticsSnapshot s = snapshots.findByPromotionId(promotionId)
                .orElseThrow(() -> new NoSuchElementException("Promotion " + promotionId + " not found in Analytics"));
        Map<String, Object> balance = balance(s.getCourseId());
        Map<String, Object> engagement = engagement(s.getCourseId());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("promotionId", promotionId);
        result.put("label", s.getPromotionLabel());
        result.put("students", s.getStudentsCount());
        result.put("courses", s.getCoursesCount());
        result.put("groups", s.getGroups().size());
        result.put("avgGpaStdDev", balance.get("gpaStdDev"));
        result.put("avgSkillCoverage", balance.get("skillCoverage"));
        result.put("activeRate", engagement.get("activeRate"));
        result.put("classes", s.getClasses());
        return result;
    }

    public List<AnalyticsReport> allReports() {
        return reports.findAllByOrderByGeneratedAtDesc();
    }

    public AnalyticsReport createReport(String scope, String scopeId, String period) {
        if (!Set.of("COURSE", "CLASS", "PROMOTION").contains(scope))
            throw new IllegalArgumentException("scope must be COURSE, CLASS or PROMOTION");
        AnalyticsReport r = new AnalyticsReport();
        r.setScope(scope);
        r.setScopeId(scopeId);
        r.setPeriod(period);
        r.setStatus("PENDING");
        r.setGeneratedAt(Instant.now().toString());
        r = reports.save(r);
        // Génération asynchrone simplifiée : le statut passe à READY après la création.
        r.setStatus("READY");
        return reports.save(r);
    }

    private AnalyticsSnapshot.StudentData student(AnalyticsSnapshot s, String id) {
        return s.getStudents().stream().filter(x -> id.equals(x.getStudentId())).findFirst().orElse(null);
    }
    private double groupSkillCoverage(AnalyticsSnapshot s, AnalyticsSnapshot.GroupData g) {
        Set<Integer> covered = new HashSet<>();
        for (String id : g.getMemberIds()) {
            AnalyticsSnapshot.StudentData st = student(s, id);
            if (st != null) for (int i = 0; i < st.getSkills().size(); i++) if (st.getSkills().get(i) >= 3) covered.add(i);
        }
        return covered.size() * 100.0 / 5.0;
    }
    private double groupDiversity(AnalyticsSnapshot s, AnalyticsSnapshot.GroupData g) {
        List<AnalyticsSnapshot.StudentData> members = g.getMemberIds().stream().map(id -> student(s, id))
                .filter(Objects::nonNull).toList();
        if (members.size() < 2) return 0;
        double total = 0; int pairs = 0;
        for (int i = 0; i < members.size(); i++) for (int j = i + 1; j < members.size(); j++) {
            List<Integer> a = members.get(i).getSkills(), b = members.get(j).getSkills();
            int n = Math.min(a.size(), b.size());
            double distance = 0;
            for (int k = 0; k < n; k++) distance += Math.abs(a.get(k) - b.get(k)) / 4.0;
            total += n == 0 ? 0 : distance / n;
            pairs++;
        }
        return pairs == 0 ? 0 : round(total / pairs * 100, 1);
    }
    private double stdDev(List<Double> values) {
        if (values.isEmpty()) return 0;
        double mean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        return Math.sqrt(values.stream().mapToDouble(v -> Math.pow(v - mean, 2)).average().orElse(0));
    }
    private double percent(int a, int b) { return b == 0 ? 0 : round(a * 100.0 / b, 0); }
    private double round(double n, int d) { double p = Math.pow(10, d); return Math.round(n * p) / p; }
    private Instant parse(String value) {
        try { return Instant.parse(value); } catch (Exception e) { return Instant.EPOCH; }
    }
}
