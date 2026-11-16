package com.hcr.corretora.features.usuarios.dto;

public record UsuarioResponse(
        Long id,
        String nome,
        String loginEmail,
        String email,
        String perfilAcesso,
        String perfil,
        String status,
        Boolean ativo
) {}
