package com.hcr.corretora.features.apolices.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ParcelaResponse(
        Long id,
        BigDecimal valor,
        LocalDate dataVencimento,
        String status,
        Long apoliceId
) {}
