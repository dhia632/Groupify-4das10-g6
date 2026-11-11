package tn.esprit.profiling.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class CsvImport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String fileName;
    private int rowsImported;
    @Enumerated(EnumType.STRING)
    private ImportStatus status = ImportStatus.PENDING;
    private String importedBy;
}
