package com.hcr.corretora.features.usuarios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsuarioCreateRequest(
        @NotBlank(message = "O e-mail de login é obrigatório")
        @Email(message = "E-mail de login inválido")
        String loginEmail,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 6, message = "A senha deve conter no mínimo 6 caracteres")
        String senha,

        @NotBlank(message = "O perfil de acesso é obrigatório")
        String perfilAcesso,

        String status
) {}
