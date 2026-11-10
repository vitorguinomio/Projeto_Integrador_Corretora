package com.hcr.corretora.features.administradores.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AdministradorRequest(
        @NotBlank(message = "O nome é obrigatório")
        String nome,

        @NotBlank(message = "O cargo é obrigatório")
        String cargo,

        @NotBlank(message = "O e-mail de login é obrigatório")
        @Email(message = "E-mail inválido")
        String email,

        String senha
) {}
