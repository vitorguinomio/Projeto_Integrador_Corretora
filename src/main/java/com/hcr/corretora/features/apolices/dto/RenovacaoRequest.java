package com.hcr.corretora.features.apolices.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record RenovacaoRequest(
        @NotNull(message = "A nova data de início é obrigatória")
        LocalDate novaDataInicio,

        @NotNull(message = "A nova data de término é obrigatória")
        LocalDate novaDataTermino,

        BigDecimal novoValorPremio,

        Integer quantidadeParcelas
) {}
