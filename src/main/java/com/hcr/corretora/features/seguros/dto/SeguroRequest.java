package com.hcr.corretora.features.seguros.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
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

        @DecimalMin(value = "0.0", message = "O percentual de comissão não pode ser negativo")
        @DecimalMax(value = "100.0", message = "O percentual de comissão deve ser de no máximo 100%")
        BigDecimal percentualComissao,

        List<CoberturaDto> coberturas
) {}
