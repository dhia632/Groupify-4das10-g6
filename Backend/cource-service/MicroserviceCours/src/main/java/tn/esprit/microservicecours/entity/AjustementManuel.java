package tn.esprit.microservicecours.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AjustementManuel {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long etudiantId;
    private Long groupeSource;
    private Long groupeCible;
    private String motif;
    private LocalDateTime dateAjustement;   // "date" est un mot reserve SQL

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "version_id")
    private VersionGroupes version;
}