package com.hcr.corretora.features.apolices.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ApoliceResponse(
        Long id,
        String numeroApolice,
        LocalDate dataInicio,
        LocalDate dataTermino,
        String situacao,
        BigDecimal valorPremio,
        Long clienteId,
        String clienteNome,
        Long corretorId,
        String corretorNome,
        Long seguroId,
        String seguroNome,
        Long idApoliceAnterior,
        List<ParcelaResponse> parcelas
) {}
