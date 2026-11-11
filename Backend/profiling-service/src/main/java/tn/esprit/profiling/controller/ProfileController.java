package tn.esprit.profiling.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tn.esprit.profiling.dto.CreateProfileRequest;
import tn.esprit.profiling.dto.ProfileResponse;
import tn.esprit.profiling.service.ProfileService;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)                       // 201
    public ProfileResponse create(@Valid @RequestBody CreateProfileRequest request) {
        return service.create(request);
    }

    @GetMapping("/{studentId}")                               // 200 ou 404
    public ProfileResponse get(@PathVariable String studentId) {
        return service.findByStudentId(studentId);
    }

    @GetMapping                                               // 200, paginé
    public Page<ProfileResponse> list(Pageable pageable) {
        return service.findAll(pageable);
    }

    @DeleteMapping("/{studentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)                    // 204
    public void delete(@PathVariable String studentId) {
        service.delete(studentId);
    }
}