package com.hcr.corretora.features.usuarios.dto;

public record UsuarioResponse(
        Long id,
        String loginEmail,
        String perfilAcesso,
        String status
) {}
