package com.hcr.corretora.features.dashboard.dto;

import java.math.BigDecimal;

public record DashboardResponse(
        long totalClientes,
        long totalCorretores,
        long totalSeguros,
        long apolicesAtivas,
        long apolicesVencidas,
        long apolicesEmRenovacao,
        long apolicesCanceladas,
        long apolicesProximasVencimento,
        long cotacoesPendentes,
        long propostasPendentes,
        BigDecimal faturamentoTotalEstimado,
        BigDecimal totalRecebidoParcelas
) {}
