package com.hcr.corretora.features.corretores.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CorretorRequest(
        @NotBlank(message = "O nome é obrigatório")
        String nome,

        @NotBlank(message = "Os dados profissionais / registro SUSEP são obrigatórios")
        String dadosProfissionais,

        String status,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail inválido")
        String email,

        String senha
) {}
