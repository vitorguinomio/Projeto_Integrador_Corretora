package com.hcr.corretora.features.clientes.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClienteRequest(
        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 150, message = "O nome deve ter no máximo 150 caracteres")
        String nome,

        @NotBlank(message = "O CPF/CNPJ é obrigatório")
        @Size(max = 20, message = "O CPF/CNPJ deve ter no máximo 20 caracteres")
        String cpfCnpj,

        @Email(message = "E-mail em formato inválido")
        String email,

        String telefone,

        String endereco
) {}
