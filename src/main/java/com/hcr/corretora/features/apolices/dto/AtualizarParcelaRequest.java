package com.hcr.corretora.features.apolices.dto;

public record AtualizarParcelaRequest(
        String status,
        String formaPagamento,
        String tipoPagamento
) {}
