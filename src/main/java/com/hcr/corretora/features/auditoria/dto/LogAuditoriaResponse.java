package com.hcr.corretora.features.auditoria.dto;

import java.time.LocalDateTime;

public record LogAuditoriaResponse(
        Long id,
        String acao,
        String acaoRealizada,
        LocalDateTime dataHora,
        String nomeTabela,
        String tabelaAfetada,
        String detalhes,
        String ipOrigem,
        Long usuarioId,
        String usuarioEmail
) {}
