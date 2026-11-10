package com.hcr.corretora.features.clientes.dto;

import java.time.LocalDate;
import java.util.List;

public record ClienteResponse(
        Long id,
        String nome,
        String cpfCnpj,
        LocalDate dataNasc,
        String email,
        Long usuarioId,
        List<EnderecoDto> enderecos,
        List<TelefoneDto> telefones
) {}
