package com.hcr.corretora.features.auditoria;

import com.hcr.corretora.features.auditoria.dto.LogAuditoriaResponse;
import com.hcr.corretora.features.usuarios.Usuario;
import com.hcr.corretora.features.usuarios.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AuditoriaService {

    private final LogAuditoriaRepository logAuditoriaRepository;
    private final UsuarioRepository usuarioRepository;

    public AuditoriaService(
            LogAuditoriaRepository logAuditoriaRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.logAuditoriaRepository = logAuditoriaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<LogAuditoriaResponse> listarTodos(String tabela) {
        List<LogAuditoria> logs = (tabela != null && !tabela.isBlank())
                ? logAuditoriaRepository.findByTabelaAfetadaIgnoreCaseOrderByDataHoraDesc(tabela.trim())
                : logAuditoriaRepository.findAllByOrderByDataHoraDesc();
        return logs.stream()
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
                ip != null ? ip : "127.0.0.1",
                usuario
        );
        logAuditoriaRepository.save(log);
    }

    @Transactional
    public void registrarOperacao(String tipoAcao, String tabela, String detalhes) {
        Usuario usuario = obterUsuarioAutenticado();
        String texto = (tipoAcao != null ? tipoAcao.toUpperCase() + ": " : "") + (detalhes != null ? detalhes : "");
        if (texto.length() > 250) {
            texto = texto.substring(0, 250);
        }
        registrar(texto, tabela, "172.18.0.1", usuario);
    }

    private Usuario obterUsuarioAutenticado() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null) {
                return usuarioRepository.findByLoginEmail(auth.getName()).orElse(null);
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    public LogAuditoriaResponse toResponse(LogAuditoria l) {
        String raw = l.getAcaoRealizada() != null ? l.getAcaoRealizada() : "OPERACAO";
        String acaoCurta = raw.contains(":") ? raw.substring(0, raw.indexOf(':')).trim() : "OPERACAO";
        String detalhes = raw.contains(":") ? raw.substring(raw.indexOf(':') + 1).trim() : raw;

        return new LogAuditoriaResponse(
                l.getId(),
                acaoCurta,
                raw,
                l.getDataHora(),
                l.getTabelaAfetada(),
                l.getTabelaAfetada(),
                detalhes,
                l.getIpOrigem(),
                l.getUsuario() != null ? l.getUsuario().getId() : null,
                l.getUsuario() != null ? l.getUsuario().getLoginEmail() : "sistema@hcr.com.br"
        );
    }
}
