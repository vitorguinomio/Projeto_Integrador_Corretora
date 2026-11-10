package com.hcr.corretora.features.seguros;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoberturaRepository extends JpaRepository<Cobertura, Long> {
    List<Cobertura> findBySeguroId(Long seguroId);
}
