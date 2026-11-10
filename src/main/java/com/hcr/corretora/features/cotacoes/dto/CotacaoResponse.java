package com.hcr.corretora.features.cotacoes.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CotacaoResponse(
        Long id,
        LocalDateTime dataSolicitacao,
        BigDecimal valor,
        String situacao,
        Long clienteId,
        String clienteNome,
        Long corretorId,
        String corretorNome,
        Long seguroId,
        String seguroNome
) {}
