package com.hcr.corretora.features.auditoria;

import com.hcr.corretora.features.auditoria.dto.LogAuditoriaResponse;
import com.hcr.corretora.features.usuarios.Usuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AuditoriaService {

    private final LogAuditoriaRepository logAuditoriaRepository;

    public AuditoriaService(LogAuditoriaRepository logAuditoriaRepository) {
        this.logAuditoriaRepository = logAuditoriaRepository;
    }

    public List<LogAuditoriaResponse> listarTodos() {
        return logAuditoriaRepository.findAllByOrderByDataHoraDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void registrar(String acao, String tabela, String ip, Usuario usuario) {
        LogAuditoria log = new LogAuditoria(
                null,
                acao,
                LocalDateTime.now(),
                tabela,
                ip,
                usuario
        );
        logAuditoriaRepository.save(log);
    }

    public LogAuditoriaResponse toResponse(LogAuditoria l) {
        return new LogAuditoriaResponse(
                l.getId(),
                l.getAcaoRealizada(),
                l.getDataHora(),
                l.getTabelaAfetada(),
                l.getIpOrigem(),
                l.getUsuario() != null ? l.getUsuario().getId() : null,
                l.getUsuario() != null ? l.getUsuario().getLoginEmail() : "SISTEMA"
        );
    }
}
