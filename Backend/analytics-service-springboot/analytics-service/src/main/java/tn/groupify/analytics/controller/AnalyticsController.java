package tn.groupify.analytics.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import tn.groupify.analytics.model.AnalyticsReport;
import tn.groupify.analytics.service.AnalyticsService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private final AnalyticsService service;
    public AnalyticsController(AnalyticsService service) { this.service = service; }

    @GetMapping("/courses/{courseId}/balance")
    public Map<String, Object> balance(@PathVariable int courseId, HttpServletRequest request) {
        requireAny(request, "TEACHER", "ADMIN");
        try { return service.balance(courseId); }
        catch (NoSuchElementException e) { throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage()); }
    }

    @GetMapping("/courses/{courseId}/engagement")
    public Map<String, Object> engagement(@PathVariable int courseId, HttpServletRequest request) {
        requireAny(request, "TEACHER", "ADMIN");
        try { return service.engagement(courseId); }
        catch (NoSuchElementException e) { throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage()); }
    }

    @GetMapping("/promotions/{promotionId}/summary")
    public Map<String, Object> promotion(@PathVariable String promotionId, HttpServletRequest request) {
        requireAny(request, "TEACHER", "ADMIN");
        try { return service.promotion(promotionId); }
        catch (NoSuchElementException e) { throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage()); }
    }

    @GetMapping("/reports")
    public List<AnalyticsReport> reports(HttpServletRequest request) {
        requireAny(request, "TEACHER", "ADMIN");
        return service.allReports();
    }

    @PostMapping("/reports")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public AnalyticsReport createReport(@Valid @RequestBody ReportRequest body, HttpServletRequest request) {
        requireAny(request, "TEACHER", "ADMIN");
        try { return service.createReport(body.scope(), body.scopeId(), body.period()); }
        catch (IllegalArgumentException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage()); }
    }

    private void requireAny(HttpServletRequest request, String... allowed) {
        String roles = request.getHeader("X-User-Roles");
        if (roles == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User identity is missing");
        for (String role : allowed) if (List.of(roles.split("[, ]+")).contains(role)) return;
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient role");
    }

    public record ReportRequest(@NotBlank String scope, @NotBlank String scopeId, @NotBlank String period) {}
}
