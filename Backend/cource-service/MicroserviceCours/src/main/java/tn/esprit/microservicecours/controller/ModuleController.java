package tn.esprit.microservicecours.controller;

import tn.esprit.microservicecours.entity.Module;
import tn.esprit.microservicecours.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/modules")
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleRepository repo;

    @GetMapping
    public List<Module> list() {
        return repo.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Module create(@RequestBody Module module) {
        return repo.save(module);
    }
}