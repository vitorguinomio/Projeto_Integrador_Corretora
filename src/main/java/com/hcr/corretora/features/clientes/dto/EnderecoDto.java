package com.hcr.corretora.features.clientes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EnderecoDto(
        Long id,

        @NotBlank(message = "O CEP é obrigatório")
        @Size(max = 10, message = "CEP deve ter até 10 caracteres")
        String cep,

        @NotBlank(message = "O logradouro é obrigatório")
        String logradouro,

        @NotBlank(message = "O número é obrigatório")
        String numero,

        String complemento,

        @NotBlank(message = "O bairro é obrigatório")
        String bairro,

        @NotBlank(message = "A cidade é obrigatória")
        String cidade,

        @NotBlank(message = "O estado (UF) é obrigatório")
        @Size(min = 2, max = 2, message = "O estado deve ter 2 caracteres")
        String estado
) {}
