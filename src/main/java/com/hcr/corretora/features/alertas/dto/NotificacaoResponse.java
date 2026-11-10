package com.hcr.corretora.features.alertas.dto;

import java.time.LocalDateTime;

public record NotificacaoResponse(
        Long id,
        String assunto,
        String status,
        LocalDateTime dataCriacao,
        Long usuarioId,
        String usuarioEmail
) {}
