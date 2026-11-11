package tn.esprit.microservicecours.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class DemandeConstitution {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dateDemande;
    private Integer nombreGroupes;

    @Column(columnDefinition = "TEXT")
    private String poidsCriteres;   // JSON stocke en texte

    private String statut;          // EN_ATTENTE, PROPOSEE, VALIDEE, PUBLIEE

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "projet_id")
    private Projet projet;
}