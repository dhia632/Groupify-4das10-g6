package tn.esprit.microservicecours.controller;

import tn.esprit.microservicecours.entity.Groupe;
import tn.esprit.microservicecours.entity.VersionGroupes;
import tn.esprit.microservicecours.repository.GroupeRepository;
import tn.esprit.microservicecours.repository.VersionGroupesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/versions")
@RequiredArgsConstructor
public class VersionController {

    private final VersionGroupesRepository versions;
    private final GroupeRepository groupes;

    @GetMapping("/{id}/groups")
    public List<Groupe> listGroups(@PathVariable Long id) {
        find(id);
        return groupes.findByVersionId(id);
    }

    // Corps attendu : {"nom":"Groupe A"}
    @PostMapping("/{id}/groups")
    @ResponseStatus(HttpStatus.CREATED)
    public Groupe createGroup(@PathVariable Long id, @RequestBody Groupe groupe) {
        VersionGroupes version = find(id);
        if (Boolean.TRUE.equals(version.getPubliee())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Version deja publiee");
        }
        groupe.setId(null);
        groupe.setVersion(version);
        groupe.setStatut("PROPOSE");
        return groupes.save(groupe);
    }

    private VersionGroupes find(Long id) {
        return versions.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Version introuvable"));
    }
}