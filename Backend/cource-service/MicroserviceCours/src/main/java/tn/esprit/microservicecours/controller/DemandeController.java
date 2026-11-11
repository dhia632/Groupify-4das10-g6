package tn.esprit.microservicecours.controller;


import tn.esprit.microservicecours.entity.*;
import tn.esprit.microservicecours.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/grouping-requests")
@RequiredArgsConstructor
@Transactional
public class DemandeController {

    private final DemandeConstitutionRepository demandes;
    private final VersionGroupesRepository versions;

    @GetMapping("/{id}")
    public DemandeConstitution get(@PathVariable Long id) {
        return find(id);
    }

    @GetMapping("/{id}/versions")
    public List<VersionGroupes> listVersions(@PathVariable Long id) {
        find(id);
        return versions.findByDemandeIdOrderByNumeroAsc(id);
    }

    // Provisoire : simule le resultat du moteur ML (futur evenement GroupsProposed)
    @PostMapping("/{id}/versions")
    @ResponseStatus(HttpStatus.CREATED)
    public VersionGroupes createVersion(@PathVariable Long id,
                                        @RequestParam(defaultValue = "ALGORITHME") String source) {
        DemandeConstitution demande = find(id);
        int numero = versions.findTopByDemandeIdOrderByNumeroDesc(id)
                .map(v -> v.getNumero() + 1).orElse(1);
        VersionGroupes v = new VersionGroupes(null, numero, LocalDateTime.now(), source, false, demande);
        demande.setStatut("PROPOSEE");
        demandes.save(demande);
        return versions.save(v);
    }

    // Validation par l'enseignant : publie la derniere version
    @PostMapping("/{id}/validate")
    public DemandeConstitution validate(@PathVariable Long id) {
        DemandeConstitution demande = find(id);
        if (!"PROPOSEE".equals(demande.getStatut())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La demande n'est pas au statut PROPOSEE");
        }
        VersionGroupes last = versions.findTopByDemandeIdOrderByNumeroDesc(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Aucune version a publier"));
        last.setPubliee(true);
        versions.save(last);
        demande.setStatut("PUBLIEE");
        return demandes.save(demande);
    }

    private DemandeConstitution find(Long id) {
        return demandes.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Demande introuvable"));
    }
}