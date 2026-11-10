package com.hcr.corretora.features.propostas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PropostaRepository extends JpaRepository<Proposta, Long> {
    Optional<Proposta> findByCotacaoId(Long cotacaoId);
    boolean existsByCotacaoId(Long cotacaoId);
}
