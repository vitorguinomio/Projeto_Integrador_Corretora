package com.hcr.corretora.features.relatorios.dto;

import java.math.BigDecimal;

public record RelatorioSeguroItem(
        Long seguroId,
        String nome,
        BigDecimal valorBase,
        int totalApolices,
        BigDecimal totalPremio
) {}
