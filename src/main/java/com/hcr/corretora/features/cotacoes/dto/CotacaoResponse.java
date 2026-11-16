package com.hcr.corretora.features.cotacoes.dto;

import com.hcr.corretora.features.propostas.dto.PropostaResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CotacaoResponse(
        Long id,
        LocalDateTime dataSolicitacao,
        String dataCotacao,
        BigDecimal valor,
        String situacao,
        Long clienteId,
        String clienteNome,
        Long corretorId,
        String corretorNome,
        Long seguroId,
        String seguroNome,
        String informacoesAdicionais,
        List<PropostaResponse> propostas
) {}
