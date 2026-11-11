package tn.esprit.microservicecours.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class VersionGroupes {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer numero;
    private LocalDateTime dateCreation;
    private String source;      // ALGORITHME ou ENSEIGNANT
    private Boolean publiee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "demande_id")
    private DemandeConstitution demande;
}
