package com.hcr.corretora.features.relatorios.dto;

import java.math.BigDecimal;

public record RelatorioCorretorItem(
        Long corretorId,
        String nome,
        String dadosProfissionais,
        String status,
        int totalCotacoes,
        int totalApolices,
        BigDecimal totalPremioGerenciado
) {}
