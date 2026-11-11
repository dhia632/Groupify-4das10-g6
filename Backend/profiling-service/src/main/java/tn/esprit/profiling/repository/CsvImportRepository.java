package tn.esprit.profiling.repository;

import tn.esprit.profiling.entity.CsvImport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CsvImportRepository extends JpaRepository<CsvImport, Long> {}
