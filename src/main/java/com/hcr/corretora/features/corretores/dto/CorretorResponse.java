package com.hcr.corretora.features.corretores.dto;

public record CorretorResponse(
        Long id,
        String nome,
        String dadosProfissionais,
        String especialidade,
        String telefone,
        String status,
        Long usuarioId,
        String email
) {}
