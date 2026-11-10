package com.hcr.corretora.features.relatorios.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RelatorioApoliceItem(
        Long apoliceId,
        String numeroApolice,
        String clienteNome,
        String corretorNome,
        String seguroNome,
        LocalDate dataInicio,
        LocalDate dataTermino,
        String situacao,
        BigDecimal valorPremio,
        long parcelasPagas,
        long parcelasPendentes
) {}
