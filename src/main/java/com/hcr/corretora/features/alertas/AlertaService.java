package com.hcr.corretora.features.alertas;

import com.hcr.corretora.features.alertas.dto.CriarNotificacaoRequest;
import com.hcr.corretora.features.alertas.dto.NotificacaoResponse;
import com.hcr.corretora.features.usuarios.Usuario;
import com.hcr.corretora.features.usuarios.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AlertaService {

    private final NotificacaoAlertaRepository notificacaoAlertaRepository;
    private final UsuarioRepository usuarioRepository;

    public AlertaService(NotificacaoAlertaRepository notificacaoAlertaRepository, UsuarioRepository usuarioRepository) {
        this.notificacaoAlertaRepository = notificacaoAlertaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<NotificacaoResponse> listarPorUsuario(String email) {
        if (email != null && !email.isBlank()) {
            return notificacaoAlertaRepository.findByUsuarioLoginEmailOrderByDataCriacaoDesc(email).stream()
                    .map(this::toResponse)
                    .toList();
        }
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
        Usuario usuario = usuarioRepository.findById(request.usuarioId())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado com id: " + request.usuarioId()));

        NotificacaoAlerta alerta = new NotificacaoAlerta(
                null,
                request.assunto().trim(),
                "PENDENTE",
                LocalDateTime.now(),
                usuario
        );

        NotificacaoAlerta salva = notificacaoAlertaRepository.save(alerta);
        return toResponse(salva);
    }

    @Transactional
    public NotificacaoResponse marcarComoLida(Long id) {
        NotificacaoAlerta alerta = notificacaoAlertaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notificação não encontrada com id: " + id));

        alerta.setStatus("LIDA");
        return toResponse(notificacaoAlertaRepository.save(alerta));
    }

    public NotificacaoResponse toResponse(NotificacaoAlerta a) {
        return new NotificacaoResponse(
                a.getId(),
                a.getAssunto(),
                a.getStatus(),
                a.getDataCriacao(),
                a.getUsuario() != null ? a.getUsuario().getId() : null,
                a.getUsuario() != null ? a.getUsuario().getLoginEmail() : null
        );
    }
}
