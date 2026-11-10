package com.hcr.corretora.features.apolices.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ApoliceRequest(
        String numeroApolice,

        @NotNull(message = "O ID do cliente é obrigatório")
        Long clienteId,

        @NotNull(message = "O ID do corretor é obrigatório")
        Long corretorId,

        @NotNull(message = "O ID do seguro é obrigatório")
        Long seguroId,

        @NotNull(message = "A data de início da vigência é obrigatória")
        LocalDate dataInicio,

        @NotNull(message = "A data de término da vigência é obrigatória")
        LocalDate dataTermino,

        BigDecimal valorPremio,

        String situacao,

        Integer quantidadeParcelas
) {}
