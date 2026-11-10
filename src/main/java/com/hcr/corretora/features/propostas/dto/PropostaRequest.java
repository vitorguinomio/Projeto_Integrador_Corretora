package com.hcr.corretora.features.propostas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PropostaRequest(
        @NotNull(message = "O ID da cotação é obrigatório")
        Long cotacaoId,

        @NotBlank(message = "As condições da proposta são obrigatórias")
        String condicoes,

        String situacao
) {}
