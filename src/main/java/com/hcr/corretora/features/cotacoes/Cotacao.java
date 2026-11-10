package com.hcr.corretora.features.cotacoes;

import com.hcr.corretora.features.clientes.Cliente;
import com.hcr.corretora.features.corretores.Corretor;
import com.hcr.corretora.features.seguros.Seguro;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cotacao")
public class Cotacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_solicitacao", nullable = false)
    private LocalDateTime dataSolicitacao;

    @Column(precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(nullable = false, length = 50)
    private String situacao = "SOLICITADA";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fk_cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fk_corretor_id")
    private Corretor corretor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fk_seguro_id", nullable = false)
    private Seguro seguro;

    public Cotacao() {}

    public Cotacao(Long id, LocalDateTime dataSolicitacao, BigDecimal valor, String situacao, Cliente cliente, Corretor corretor, Seguro seguro) {
        this.id = id;
        this.dataSolicitacao = dataSolicitacao != null ? dataSolicitacao : LocalDateTime.now();
        this.valor = valor;
        this.situacao = (situacao != null && !situacao.isBlank()) ? situacao : "SOLICITADA";
        this.cliente = cliente;
        this.corretor = corretor;
        this.seguro = seguro;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getDataSolicitacao() {
        return dataSolicitacao;
    }

    public void setDataSolicitacao(LocalDateTime dataSolicitacao) {
        this.dataSolicitacao = dataSolicitacao;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public String getSituacao() {
        return situacao;
    }

    public void setSituacao(String situacao) {
        this.situacao = situacao;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Corretor getCorretor() {
        return corretor;
    }

    public void setCorretor(Corretor corretor) {
        this.corretor = corretor;
    }

    public Seguro getSeguro() {
        return seguro;
    }

    public void setSeguro(Seguro seguro) {
        this.seguro = seguro;
    }
}
