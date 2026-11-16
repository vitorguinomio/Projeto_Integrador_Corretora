package com.hcr.corretora.features.seguros.dto;

import java.math.BigDecimal;

public record CoberturaDto(
        Long id,
        String descricao,
        String nome,
        BigDecimal valor,
        BigDecimal valorLimite
) {
    public CoberturaDto(Long id, String descricao, BigDecimal valor) {
        this(id, descricao, descricao, valor, valor);
    }
}
