package com.hcr.corretora.features.apolices;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "parcela_pagamentos")
public class ParcelaPagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_parcela")
    private Integer numeroParcela;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(name = "data_vencimento", nullable = false)
    private LocalDate dataVencimento;

    @Column(nullable = false, length = 30)
    private String status = "PENDENTE";

    @Column(name = "forma_pagamento", length = 50)
    private String formaPagamento;

    @Column(name = "data_pagamento")
    private LocalDate dataPagamento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fk_apolice_id", nullable = false)
    @JsonBackReference
    private Apolice apolice;

    public ParcelaPagamento() {}

    public ParcelaPagamento(Long id, BigDecimal valor, LocalDate dataVencimento, String status, Apolice apolice) {
        this(id, null, valor, dataVencimento, status, null, null, apolice);
    }

    public ParcelaPagamento(
            Long id,
            Integer numeroParcela,
            BigDecimal valor,
            LocalDate dataVencimento,
            String status,
            String formaPagamento,
            LocalDate dataPagamento,
            Apolice apolice
    ) {
        this.id = id;
        this.numeroParcela = numeroParcela;
        this.valor = valor;
        this.dataVencimento = dataVencimento;
        this.status = (status != null && !status.isBlank()) ? status : "PENDENTE";
        this.formaPagamento = formaPagamento;
        this.dataPagamento = dataPagamento;
        this.apolice = apolice;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getNumeroParcela() {
        return numeroParcela;
    }

    public void setNumeroParcela(Integer numeroParcela) {
        this.numeroParcela = numeroParcela;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public LocalDate getDataVencimento() {
        return dataVencimento;
    }

    public void setDataVencimento(LocalDate dataVencimento) {
        this.dataVencimento = dataVencimento;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getFormaPagamento() {
        return formaPagamento;
    }

    public void setFormaPagamento(String formaPagamento) {
        this.formaPagamento = formaPagamento;
    }

    public LocalDate getDataPagamento() {
        return dataPagamento;
    }

    public void setDataPagamento(LocalDate dataPagamento) {
        this.dataPagamento = dataPagamento;
    }

    public Apolice getApolice() {
        return apolice;
    }

    public void setApolice(Apolice apolice) {
        this.apolice = apolice;
    }
}
