package com.hcr.corretora.features.seguros.dto;

import java.math.BigDecimal;
import java.util.List;

public record SeguroResponse(
        Long id,
        String nome,
        String descricao,
        String caracteristicas,
        String tipo,
        BigDecimal valorBase,
        BigDecimal premioBase,
        List<CoberturaDto> coberturas
) {}
