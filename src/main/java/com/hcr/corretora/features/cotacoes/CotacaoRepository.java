package com.hcr.corretora.features.cotacoes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CotacaoRepository extends JpaRepository<Cotacao, Long> {
    List<Cotacao> findByClienteId(Long clienteId);
    List<Cotacao> findByCorretorId(Long corretorId);
    List<Cotacao> findBySituacao(String situacao);
    List<Cotacao> findByClienteUsuarioId(Long usuarioId);
}
