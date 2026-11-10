package com.hcr.corretora.features.relatorios.dto;

import java.math.BigDecimal;

public record RelatorioClienteItem(
        Long clienteId,
        String nome,
        String cpfCnpj,
        String email,
        int totalApolices,
        long apolicesAtivas,
        BigDecimal totalPremio
) {}
