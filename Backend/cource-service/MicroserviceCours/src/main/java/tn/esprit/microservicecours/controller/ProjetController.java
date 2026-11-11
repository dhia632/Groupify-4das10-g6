package tn.esprit.microservicecours.controller;


import tn.esprit.microservicecours.entity.*;
import tn.esprit.microservicecours.entity.Module;
import tn.esprit.microservicecours.repository.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjetController {

    private final ProjetRepository projets;
    private final ModuleRepository modules;
    private final ClasseRepository classes;
    private final DemandeConstitutionRepository demandes;

    @GetMapping
    public List<Projet> list(@RequestParam(required = false) Long classeId) {
        return (classeId == null) ? projets.findAll() : projets.findByClasseId(classeId);
    }

    @GetMapping("/{id}")
    public Projet get(@PathVariable Long id) {
        return find(id);
    }

    // Corps attendu : {"titre":"...","tailleMin":3,"tailleMax":5,"module":{"id":1},"classe":{"id":1}}
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Projet create(@RequestBody Projet projet) {
        if (projet.getModule() == null || projet.getModule().getId() == null
                || projet.getClasse() == null || projet.getClasse().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "module.id et classe.id sont obligatoires");
        }
        Module module = modules.findById(projet.getModule().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module introuvable"));
        Classe classe = classes.findById(projet.getClasse().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classe introuvable"));
        if (projet.getTailleMin() != null && projet.getTailleMax() != null
                && projet.getTailleMin() > projet.getTailleMax()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tailleMin > tailleMax");
        }
        projet.setId(null);
        projet.setModule(module);
        projet.setClasse(classe);
        return projets.save(projet);
    }

    // Lancer une constitution : {"nombreGroupes":4,"poidsCriteres":"{\"gpa\":0.5}"}
    @PostMapping("/{id}/grouping-requests")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public DemandeConstitution requestGrouping(@PathVariable Long id, @RequestBody DemandeConstitution demande) {
        Projet projet = find(id);
        demande.setId(null);
        demande.setProjet(projet);
        demande.setDateDemande(LocalDateTime.now());
        demande.setStatut("EN_ATTENTE");
        return demandes.save(demande);
    }

    @GetMapping("/{id}/grouping-requests")
    public List<DemandeConstitution> listRequests(@PathVariable Long id) {
        find(id);
        return demandes.findByProjetId(id);
    }

    private Projet find(Long id) {
        return projets.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projet introuvable"));
    }
}