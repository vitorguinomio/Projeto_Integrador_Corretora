package com.hcr.corretora.features.seguros.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record CoberturaDto(
        Long id,

        @NotBlank(message = "A descrição da cobertura é obrigatória")
        String descricao,

        BigDecimal valor
) {}
