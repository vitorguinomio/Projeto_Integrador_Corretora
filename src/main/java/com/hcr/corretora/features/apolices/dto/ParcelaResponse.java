package com.hcr.corretora.features.apolices.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ParcelaResponse(
        Long id,
        Integer numeroParcela,
        BigDecimal valor,
        LocalDate dataVencimento,
        String status,
        String situacao,
        String formaPagamento,
        String tipoPagamento,
        LocalDate dataPagamento,
        Long apoliceId
) {}
