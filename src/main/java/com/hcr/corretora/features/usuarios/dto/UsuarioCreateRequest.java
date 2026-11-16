package com.hcr.corretora.features.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsuarioCreateRequest(
        String nome,

        String loginEmail,

        String email,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 6, message = "A senha deve conter no mínimo 6 caracteres")
        String senha,

        String perfilAcesso,

        String perfil,

        String status
) {}
