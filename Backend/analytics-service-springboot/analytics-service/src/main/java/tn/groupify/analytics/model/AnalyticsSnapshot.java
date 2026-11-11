package tn.groupify.analytics.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "analytics_snapshots")
public class AnalyticsSnapshot {
    @Id
    private String id;
    private int courseId;
    private int projectId;
    private String promotionId;
    private String promotionLabel;
    private int studentsCount;
    private int coursesCount;
    private List<StudentData> students = new ArrayList<>();
    private List<GroupData> groups = new ArrayList<>();
    private List<ContributionData> contributions = new ArrayList<>();
    private List<ClassData> classes = new ArrayList<>();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public int getCourseId() { return courseId; }
    public void setCourseId(int courseId) { this.courseId = courseId; }
    public int getProjectId() { return projectId; }
    public void setProjectId(int projectId) { this.projectId = projectId; }
    public String getPromotionId() { return promotionId; }
    public void setPromotionId(String promotionId) { this.promotionId = promotionId; }
    public String getPromotionLabel() { return promotionLabel; }
    public void setPromotionLabel(String promotionLabel) { this.promotionLabel = promotionLabel; }
    public int getStudentsCount() { return studentsCount; }
    public void setStudentsCount(int studentsCount) { this.studentsCount = studentsCount; }
    public int getCoursesCount() { return coursesCount; }
    public void setCoursesCount(int coursesCount) { this.coursesCount = coursesCount; }
    public List<StudentData> getStudents() { return students; }
    public void setStudents(List<StudentData> students) { this.students = students; }
    public List<GroupData> getGroups() { return groups; }
    public void setGroups(List<GroupData> groups) { this.groups = groups; }
    public List<ContributionData> getContributions() { return contributions; }
    public void setContributions(List<ContributionData> contributions) { this.contributions = contributions; }
    public List<ClassData> getClasses() { return classes; }
    public void setClasses(List<ClassData> classes) { this.classes = classes; }

    public static class StudentData {
        private String studentId;
        private String displayName;
        private double gpa;
        private String className;
        private List<Integer> skills = new ArrayList<>();
        public String getStudentId() { return studentId; }
        public void setStudentId(String studentId) { this.studentId = studentId; }
        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
        public double getGpa() { return gpa; }
        public void setGpa(double gpa) { this.gpa = gpa; }
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        public List<Integer> getSkills() { return skills; }
        public void setSkills(List<Integer> skills) { this.skills = skills; }
    }

    public static class GroupData {
        private int groupId;
        private String name;
        private List<String> memberIds = new ArrayList<>();
        private int points;
        private int badges;
        private int deliverablesTotal;
        private int deliverablesOnTime;
        public int getGroupId() { return groupId; }
        public void setGroupId(int groupId) { this.groupId = groupId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public List<String> getMemberIds() { return memberIds; }
        public void setMemberIds(List<String> memberIds) { this.memberIds = memberIds; }
        public int getPoints() { return points; }
        public void setPoints(int points) { this.points = points; }
        public int getBadges() { return badges; }
        public void setBadges(int badges) { this.badges = badges; }
        public int getDeliverablesTotal() { return deliverablesTotal; }
        public void setDeliverablesTotal(int deliverablesTotal) { this.deliverablesTotal = deliverablesTotal; }
        public int getDeliverablesOnTime() { return deliverablesOnTime; }
        public void setDeliverablesOnTime(int deliverablesOnTime) { this.deliverablesOnTime = deliverablesOnTime; }
    }

    public static class ContributionData {
        private String studentId;
        private int groupId;
        private int points;
        private String recordedAt;
        public String getStudentId() { return studentId; }
        public void setStudentId(String studentId) { this.studentId = studentId; }
        public int getGroupId() { return groupId; }
        public void setGroupId(int groupId) { this.groupId = groupId; }
        public int getPoints() { return points; }
        public void setPoints(int points) { this.points = points; }
        public String getRecordedAt() { return recordedAt; }
        public void setRecordedAt(String recordedAt) { this.recordedAt = recordedAt; }
    }

    public static class ClassData {
        private String className;
        private int groups;
        private double gpaStdDev;
        private double activeRate;
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        public int getGroups() { return groups; }
        public void setGroups(int groups) { this.groups = groups; }
        public double getGpaStdDev() { return gpaStdDev; }
        public void setGpaStdDev(double gpaStdDev) { this.gpaStdDev = gpaStdDev; }
        public double getActiveRate() { return activeRate; }
        public void setActiveRate(double activeRate) { this.activeRate = activeRate; }
    }
}
