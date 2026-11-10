package com.hcr.corretora.features.seguros;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import java.util.List;

@Repository
public interface SeguroRepository extends JpaRepository<Seguro, Long> {
    Optional<Seguro> findByNome(String nome);
    boolean existsByNome(String nome);

    @Query("SELECT DISTINCT s FROM Seguro s LEFT JOIN FETCH s.coberturas")
    List<Seguro> findAllWithCoberturas();
}
