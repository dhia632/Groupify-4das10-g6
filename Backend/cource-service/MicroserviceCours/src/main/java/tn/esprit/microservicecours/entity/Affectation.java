package tn.esprit.microservicecours.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Affectation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long etudiantId;    // identifiant seulement, le profil reste dans User/Profiling
    private String origine;
    private LocalDateTime dateAffectation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "groupe_id")
    private Groupe groupe;
}
