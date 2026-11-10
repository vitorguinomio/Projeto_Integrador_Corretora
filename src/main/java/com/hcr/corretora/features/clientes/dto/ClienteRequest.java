package com.hcr.corretora.features.clientes.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record ClienteRequest(
        @NotBlank(message = "O nome é obrigatório")
        String nome,

        @NotBlank(message = "O CPF ou CNPJ é obrigatório")
        String cpfCnpj,

        @NotNull(message = "A data de nascimento é obrigatória")
        LocalDate dataNasc,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail inválido")
        String email,

        String senhaAcesso,

        List<EnderecoDto> enderecos,

        List<TelefoneDto> telefones
) {}
