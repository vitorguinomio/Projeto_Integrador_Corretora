package com.hcr.corretora.features.administradores.dto;

public record AdministradorResponse(
        Long id,
        String nome,
        String cargo,
        Long usuarioId,
        String email,
        String status
) {}
