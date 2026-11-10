package com.hcr.corretora.features.propostas.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PropostaResponse(
        Long id,
        String condicoes,
        String situacao,
        Long cotacaoId,
        BigDecimal valorCotacao,
        LocalDateTime dataSolicitacao,
        Long clienteId,
        String clienteNome,
        Long corretorId,
        String corretorNome,
        Long seguroId,
        String seguroNome
) {}
