package com.hcr.corretora.features.auth.dto;

public record LoginResponse(
        String token,
        String tipo,
        Long userId,
        String email,
        String perfilAcesso,
        String nome,
        String status
) {}
