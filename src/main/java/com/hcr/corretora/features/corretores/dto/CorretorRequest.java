package com.hcr.corretora.features.corretores.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CorretorRequest(
        @NotBlank(message = "O nome é obrigatório")
        String nome,

        @NotBlank(message = "Os dados profissionais / registro SUSEP são obrigatórios")
        String dadosProfissionais,

        @Size(max = 100, message = "A especialidade deve ter no máximo 100 caracteres")
        String especialidade,

        @Pattern(regexp = "^$|^\\(\\d{2}\\) \\d{5}-\\d{4}$",
                message = "Telefone inválido. Use o formato (xx) xxxxx-xxxx")
        String telefone,

        String status,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail inválido")
        String email,

        String senha
) {}
