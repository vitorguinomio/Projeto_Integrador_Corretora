package com.hcr.corretora.features.alertas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacaoAlertaRepository extends JpaRepository<NotificacaoAlerta, Long> {
    List<NotificacaoAlerta> findByUsuarioIdOrderByDataCriacaoDesc(Long usuarioId);
    List<NotificacaoAlerta> findByUsuarioLoginEmailOrderByDataCriacaoDesc(String email);
    long countByUsuarioLoginEmailAndStatus(String email, String status);
}
