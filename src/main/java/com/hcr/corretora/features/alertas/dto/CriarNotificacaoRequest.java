package com.hcr.corretora.features.alertas.dto;

import jakarta.validation.constraints.NotBlank;

public record CriarNotificacaoRequest(
        @NotBlank(message = "O assunto da notificação é obrigatório")
        String assunto,

        Long usuarioId
) {}
