package tn.esprit.gamification.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "emblem")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Emblem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false)
    private String imageUrl;
}
