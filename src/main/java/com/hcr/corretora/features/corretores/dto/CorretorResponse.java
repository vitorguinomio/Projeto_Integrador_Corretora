package com.hcr.corretora.features.corretores.dto;

public record CorretorResponse(
        Long id,
        String nome,
        String dadosProfissionais,
        String registroSusep,
        String especialidade,
        String telefone,
        String status,
        Long usuarioId,
        String email,
        Long totalClientes,
        Long totalApolices
) {}
