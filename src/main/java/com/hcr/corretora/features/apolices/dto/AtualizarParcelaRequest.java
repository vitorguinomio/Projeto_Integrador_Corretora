package com.hcr.corretora.features.apolices.dto;

import jakarta.validation.constraints.NotBlank;

public record AtualizarParcelaRequest(
        @NotBlank(message = "O status da parcela é obrigatório (PAGO ou PENDENTE)")
        String status
) {}
