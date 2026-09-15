package com.hcr.corretora.features.dashboard;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Service
public class DashboardService {

    public Map<String, Object> obterMetricasGerais() {
        // Stub com métricas fictícias para o dashboard inicial
        return Map.of(
                "totalClientes", 142,
                "apolicesAtivas", 98,
                "apolicesPendentes", 12,
                "faturamentoMensal", new BigDecimal("185400.00"),
                "taxaConversao", "74.5%"
        );
    }
}
