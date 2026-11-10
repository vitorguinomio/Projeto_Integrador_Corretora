package com.hcr.corretora.features.cotacoes.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CotacaoRequest(
        @NotNull(message = "O ID do cliente é obrigatório")
        Long clienteId,

        Long corretorId,

        @NotNull(message = "O ID do seguro é obrigatório")
        Long seguroId,

        BigDecimal valor,

        String situacao
) {}
