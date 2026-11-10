package com.hcr.corretora.features.corretores;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CorretorRepository extends JpaRepository<Corretor, Long> {
    Optional<Corretor> findByDadosProfissionais(String dadosProfissionais);
    boolean existsByDadosProfissionais(String dadosProfissionais);
    Optional<Corretor> findByUsuarioId(Long usuarioId);
    List<Corretor> findByStatus(String status);
}
