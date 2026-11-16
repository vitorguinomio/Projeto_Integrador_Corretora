package com.hcr.corretora.features.alertas.dto;

import java.time.LocalDateTime;

public record NotificacaoResponse(
        Long id,
        String assunto,
        String titulo,
        String mensagem,
        String tipo,
        String status,
        Boolean lido,
        LocalDateTime dataCriacao,
        Long usuarioId,
        String usuarioEmail
) {}
