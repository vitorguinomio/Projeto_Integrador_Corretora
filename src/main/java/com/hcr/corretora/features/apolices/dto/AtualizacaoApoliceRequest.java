package com.hcr.corretora.features.apolices.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Corpo de PUT /apolices/{id} (RF13). Cliente e seguro não mudam numa apólice emitida;
 * situação muda por renovação, cancelamento ou vencimento.
 */
public record AtualizacaoApoliceRequest(
        @NotNull(message = "O corretor responsável é obrigatório")
        Long corretorId,

        @NotNull(message = "A data de início da vigência é obrigatória")
        LocalDate dataInicio,

        @NotNull(message = "A data de término da vigência é obrigatória")
        LocalDate dataTermino,

        @NotNull(message = "O valor do prêmio é obrigatório")
        @DecimalMin(value = "0.01", message = "O valor do prêmio deve ser maior que zero")
        BigDecimal valorPremio
) {}
