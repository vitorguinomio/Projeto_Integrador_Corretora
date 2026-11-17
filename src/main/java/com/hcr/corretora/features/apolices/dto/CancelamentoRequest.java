package com.hcr.corretora.features.apolices.dto;

import jakarta.validation.constraints.Size;

/** Corpo opcional de POST /apolices/{id}/cancelar (RF23). */
public record CancelamentoRequest(
        @Size(max = 255, message = "O motivo deve ter no máximo 255 caracteres")
        String motivo
) {}
