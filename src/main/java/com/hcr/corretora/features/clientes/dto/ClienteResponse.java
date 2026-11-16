package com.hcr.corretora.features.clientes.dto;

import java.time.LocalDate;
import java.util.List;

public record ClienteResponse(
        Long id,
        String nome,
        String cpfCnpj,
        String tipo,
        LocalDate dataNasc,
        String email,
        Long usuarioId,
        Long corretorId,
        String corretorNome,
        Integer totalApolices,
        List<EnderecoDto> enderecos,
        List<TelefoneDto> telefones
) {}
