package com.hcr.corretora.features.seguros.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.List;

public record SeguroRequest(
        @NotBlank(message = "O nome do seguro é obrigatório")
        String nome,

        String descricao,

        String caracteristicas,

        String tipo,

        BigDecimal valorBase,

        BigDecimal premioBase,

        List<CoberturaDto> coberturas
) {}
