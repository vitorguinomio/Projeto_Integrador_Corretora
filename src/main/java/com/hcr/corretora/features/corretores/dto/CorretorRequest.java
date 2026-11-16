package com.hcr.corretora.features.corretores.dto;

import jakarta.validation.constraints.NotBlank;

public record CorretorRequest(
        @NotBlank(message = "O nome do corretor é obrigatório")
        String nome,

        String dadosProfissionais,

        String registroSusep,

        String especialidade,

        String telefone,

        String status,

        @NotBlank(message = "O e-mail corporativo é obrigatório")
        String email,

        String senha
) {}
