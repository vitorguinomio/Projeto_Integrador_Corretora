package com.hcr.corretora.features.alertas;

import com.hcr.corretora.features.alertas.dto.CriarNotificacaoRequest;
import com.hcr.corretora.features.alertas.dto.NotificacaoResponse;
import com.hcr.corretora.features.auditoria.AuditoriaService;
import com.hcr.corretora.features.usuarios.Usuario;
import com.hcr.corretora.features.usuarios.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AlertaService {

    private final NotificacaoAlertaRepository notificacaoAlertaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;

    public AlertaService(
            NotificacaoAlertaRepository notificacaoAlertaRepository,
            UsuarioRepository usuarioRepository,
            AuditoriaService auditoriaService
    ) {
        this.notificacaoAlertaRepository = notificacaoAlertaRepository;
        this.usuarioRepository = usuarioRepository;
        this.auditoriaService = auditoriaService;
    }

    public List<NotificacaoResponse> listarPorUsuario(String email) {
        return notificacaoAlertaRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<NotificacaoResponse> listarPorUsuarioId(Long usuarioId) {
        return notificacaoAlertaRepository.findByUsuarioIdOrderByDataCriacaoDesc(usuarioId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public NotificacaoResponse criar(CriarNotificacaoRequest request) {
        Usuario usuario = null;
        if (request.usuarioId() != null) {
            usuario = usuarioRepository.findById(request.usuarioId()).orElse(null);
        }
        if (usuario == null) {
            List<Usuario> todos = usuarioRepository.findAll();
            if (todos.isEmpty()) {
                throw new IllegalArgumentException("Nenhum usuário cadastrado para vincular a notificação.");
            }
            usuario = todos.get(0);
        }

        NotificacaoAlerta alerta = new NotificacaoAlerta(
                null,
                request.assunto().trim(),
                "PENDENTE",
                LocalDateTime.now(),
                usuario
        );

        NotificacaoAlerta salva = notificacaoAlertaRepository.save(alerta);
        auditoriaService.registrarOperacao(
                "CRIACAO",
                "notificacao_alerta",
                "Registro de alerta/notificação #" + salva.getId() + ": " + salva.getAssunto()
        );
        return toResponse(salva);
    }

    @Transactional
    public NotificacaoResponse marcarComoLida(Long id) {
        NotificacaoAlerta alerta = notificacaoAlertaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notificação não encontrada com id: " + id));

        alerta.setStatus("LIDA");
        NotificacaoAlerta salva = notificacaoAlertaRepository.save(alerta);
        auditoriaService.registrarOperacao("ATUALIZAR", "notificacao_alerta", "Notificação #" + id + " marcada como lida");
        return toResponse(salva);
    }

    public NotificacaoResponse toResponse(NotificacaoAlerta a) {
        String assunto = a.getAssunto() != null ? a.getAssunto() : "Notificação do sistema";
        boolean isVencimento = assunto.toLowerCase().contains("vence") || assunto.toLowerCase().contains("vencimento") || assunto.toLowerCase().contains("renova");
        String titulo = isVencimento ? "Alerta de Vigência / Renovação" : "Notificação do Sistema";
        boolean lido = "LIDA".equalsIgnoreCase(a.getStatus()) || "LIDO".equalsIgnoreCase(a.getStatus());

        return new NotificacaoResponse(
                a.getId(),
                assunto,
                titulo,
                assunto,
                isVencimento ? "VENCIMENTO" : "SISTEMA",
                a.getStatus(),
                lido,
                a.getDataCriacao(),
                a.getUsuario() != null ? a.getUsuario().getId() : null,
                a.getUsuario() != null ? a.getUsuario().getLoginEmail() : null
        );
    }
}
