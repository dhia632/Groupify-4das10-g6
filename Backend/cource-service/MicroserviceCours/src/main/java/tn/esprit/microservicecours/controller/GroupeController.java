package tn.esprit.microservicecours.controller;

import tn.esprit.microservicecours.entity.Affectation;
import tn.esprit.microservicecours.entity.AjustementManuel;
import tn.esprit.microservicecours.entity.Groupe;
import tn.esprit.microservicecours.entity.VersionGroupes;
import tn.esprit.microservicecours.repository.AffectationRepository;
import tn.esprit.microservicecours.repository.AjustementManuelRepository;
import tn.esprit.microservicecours.repository.GroupeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@Transactional
public class GroupeController {

    private final GroupeRepository groupes;
    private final AffectationRepository affectations;
    private final AjustementManuelRepository ajustements;

    @GetMapping("/{id}")
    public Groupe get(@PathVariable Long id) {
        return find(id);
    }

    @GetMapping("/{id}/members")
    public List<Affectation> members(@PathVariable Long id) {
        find(id);
        return affectations.findByGroupeId(id);
    }

    // Provisoire. Corps attendu : {"etudiantId":101}
    @PostMapping("/{id}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public Affectation addMember(@PathVariable Long id, @RequestBody Affectation affectation) {
        if (affectation.getEtudiantId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "etudiantId est obligatoire");
        }
        Groupe groupe = find(id);
        VersionGroupes version = groupe.getVersion();
        if (Boolean.TRUE.equals(version.getPubliee())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Version deja publiee");
        }
        if (affectations.findByGroupeVersionIdAndEtudiantId(version.getId(), affectation.getEtudiantId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Etudiant deja affecte dans cette version");
        }
        affectation.setId(null);
        affectation.setGroupe(groupe);
        affectation.setOrigine("ALGORITHME");
        affectation.setDateAffectation(LocalDateTime.now());
        return affectations.save(affectation);
    }

    // Deplacer un etudiant vers le groupe {id} (ajustement manuel de l'enseignant)
    // Exemple : PUT /api/groups/2/members/101?motif=equilibrer
    @PutMapping("/{id}/members/{studentId}")
    public Affectation moveStudent(@PathVariable Long id, @PathVariable Long studentId,
                                   @RequestParam(required = false) String motif) {
        Groupe target = find(id);
        VersionGroupes version = target.getVersion();
        if (Boolean.TRUE.equals(version.getPubliee())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Version deja publiee");
        }
        Affectation a = affectations.findByGroupeVersionIdAndEtudiantId(version.getId(), studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etudiant non affecte"));
        Long sourceId = a.getGroupe().getId();
        if (sourceId.equals(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Etudiant deja dans ce groupe");
        }
        a.setGroupe(target);
        a.setOrigine("MANUEL");
        a.setDateAffectation(LocalDateTime.now());
        affectations.save(a);

        ajustements.save(new AjustementManuel(null, studentId, sourceId, id, motif,
                LocalDateTime.now(), version));
        return a;
    }

    private Groupe find(Long id) {
        return groupes.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Groupe introuvable"));
    }
}