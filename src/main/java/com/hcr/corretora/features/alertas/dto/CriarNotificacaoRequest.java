package com.hcr.corretora.features.alertas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CriarNotificacaoRequest(
        @NotBlank(message = "O assunto da notificação é obrigatório")
        String assunto,

        @NotNull(message = "O ID do usuário destinatário é obrigatório")
        Long usuarioId
) {}
