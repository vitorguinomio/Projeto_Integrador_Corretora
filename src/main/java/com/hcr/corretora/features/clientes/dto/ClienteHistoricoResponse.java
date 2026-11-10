package com.hcr.corretora.features.clientes.dto;

import com.hcr.corretora.features.apolices.dto.ApoliceResponse;
import com.hcr.corretora.features.cotacoes.dto.CotacaoResponse;

import java.util.List;

public record ClienteHistoricoResponse(
        ClienteResponse cliente,
        List<CotacaoResponse> cotacoes,
        List<ApoliceResponse> apolices
) {}
