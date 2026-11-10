package com.hcr.corretora.features.seguros.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.List;

public record SeguroRequest(
        @NotBlank(message = "O nome do seguro é obrigatório")
        String nome,

        @NotBlank(message = "A descrição do seguro é obrigatória")
        String descricao,

        String caracteristicas,

        BigDecimal valorBase,

        List<CoberturaDto> coberturas
) {}
