package com.hcr.corretora.features.clientes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TelefoneDto(
        Long id,

        @NotBlank(message = "O DDD é obrigatório")
        @Size(min = 2, max = 2, message = "DDD deve ter 2 dígitos")
        String ddd,

        @NotBlank(message = "O número de telefone é obrigatório")
        @Size(max = 15, message = "Número deve ter até 15 dígitos")
        String numero,

        String tipo
) {}
