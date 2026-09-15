package com.hcr.corretora.features.apolices.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ApoliceRequest(
        @NotBlank(message = "O número da apólice é obrigatório")
        String numeroApolice,

        @NotNull(message = "O ID do cliente é obrigatório")
        Long clienteId,

        @NotNull(message = "O ID do seguro é obrigatório")
        Long seguroId,

        @NotNull(message = "A data de início é obrigatória")
        LocalDate dataInicio,

        @NotNull(message = "A data de término é obrigatória")
        LocalDate dataFim,

        @NotNull(message = "O valor do prêmio é obrigatório")
        @DecimalMin(value = "0.01", message = "O valor do prêmio deve ser positivo")
        BigDecimal valorPremio,

        String status
) {}
