package tn.esprit.microservicecours.controller;


import tn.esprit.microservicecours.entity.Classe;
import tn.esprit.microservicecours.repository.ClasseRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClasseController {

    private final ClasseRepository repo;

    @GetMapping
    public List<Classe> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public Classe get(@PathVariable Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classe introuvable"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Classe create(@RequestBody Classe classe) {
        classe.setId(null);
        return repo.save(classe);
    }
}