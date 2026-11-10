package com.hcr.corretora.features.auditoria.dto;

import java.time.LocalDateTime;

public record LogAuditoriaResponse(
        Long id,
        String acaoRealizada,
        LocalDateTime dataHora,
        String tabelaAfetada,
        String ipOrigem,
        Long usuarioId,
        String usuarioEmail
) {}
