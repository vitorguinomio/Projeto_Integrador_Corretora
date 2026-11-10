package com.hcr.corretora.features.apolices;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.hcr.corretora.features.clientes.Cliente;
import com.hcr.corretora.features.corretores.Corretor;
import com.hcr.corretora.features.seguros.Seguro;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "apolice")
public class Apolice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_apolice", nullable = false, unique = true, length = 50)
    private String numeroApolice;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_termino", nullable = false)
    private LocalDate dataTermino;

    @Column(nullable = false, length = 50)
    private String situacao = "ATIVA";

    @Column(name = "valor_premio", precision = 10, scale = 2)
    private BigDecimal valorPremio = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fk_cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fk_corretor_id", nullable = false)
    private Corretor corretor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fk_seguro_id", nullable = false)
    private Seguro seguro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_apolice_anterior")
    private Apolice apoliceAnterior;

    @OneToMany(mappedBy = "apolice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<ParcelaPagamento> parcelas = new ArrayList<>();

    public Apolice() {}

    public Apolice(Long id, String numeroApolice, LocalDate dataInicio, LocalDate dataTermino, String situacao, BigDecimal valorPremio, Cliente cliente, Corretor corretor, Seguro seguro, Apolice apoliceAnterior) {
        this.id = id;
        this.numeroApolice = numeroApolice;
        this.dataInicio = dataInicio;
        this.dataTermino = dataTermino;
        this.situacao = (situacao != null && !situacao.isBlank()) ? situacao : "ATIVA";
        this.valorPremio = valorPremio != null ? valorPremio : BigDecimal.ZERO;
        this.cliente = cliente;
        this.corretor = corretor;
        this.seguro = seguro;
        this.apoliceAnterior = apoliceAnterior;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNumeroApolice() {
        return numeroApolice;
    }

    public void setNumeroApolice(String numeroApolice) {
        this.numeroApolice = numeroApolice;
    }

    public LocalDate getDataInicio() {
        return dataInicio;
    }

    public void setDataInicio(LocalDate dataInicio) {
        this.dataInicio = dataInicio;
    }

    public LocalDate getDataTermino() {
        return dataTermino;
    }

    public void setDataTermino(LocalDate dataTermino) {
        this.dataTermino = dataTermino;
    }

    public String getSituacao() {
        return situacao;
    }

    public void setSituacao(String situacao) {
        this.situacao = situacao;
    }

    public BigDecimal getValorPremio() {
        return valorPremio;
    }

    public void setValorPremio(BigDecimal valorPremio) {
        this.valorPremio = valorPremio;
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

    public Apolice getApoliceAnterior() {
        return apoliceAnterior;
    }

    public void setApoliceAnterior(Apolice apoliceAnterior) {
        this.apoliceAnterior = apoliceAnterior;
    }

    public List<ParcelaPagamento> getParcelas() {
        return parcelas;
    }

    public void setParcelas(List<ParcelaPagamento> parcelas) {
        this.parcelas = parcelas;
    }

    public void addParcela(ParcelaPagamento parcela) {
        this.parcelas.add(parcela);
        parcela.setApolice(this);
    }
}
