package com.hcr.corretora.features.clientes.dto;

import com.hcr.corretora.features.apolices.dto.ApoliceResponse;
import com.hcr.corretora.features.cotacoes.dto.CotacaoResponse;

import java.util.List;

public record ClienteHistoricoResponse(
        Long id,
        String nome,
        String cpfCnpj,
        String email,
        List<EnderecoDto> enderecos,
        List<TelefoneDto> telefones,
        ClienteResponse cliente,
        List<CotacaoResponse> cotacoes,
        List<ApoliceResponse> apolices
) {}
