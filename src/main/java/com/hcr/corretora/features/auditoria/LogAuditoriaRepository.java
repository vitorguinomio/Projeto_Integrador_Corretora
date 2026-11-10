package com.hcr.corretora.features.auditoria;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, Long> {
    List<LogAuditoria> findAllByOrderByDataHoraDesc();
    List<LogAuditoria> findByTabelaAfetadaOrderByDataHoraDesc(String tabelaAfetada);
}
