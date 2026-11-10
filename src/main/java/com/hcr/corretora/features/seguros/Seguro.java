package com.hcr.corretora.features.seguros;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "seguro")
public class Seguro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String descricao;

    @Column(columnDefinition = "TEXT")
    private String caracteristicas;

    @Column(name = "valor_base", precision = 10, scale = 2)
    private BigDecimal valorBase = BigDecimal.ZERO;

    @OneToMany(mappedBy = "seguro", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Cobertura> coberturas = new ArrayList<>();

    public Seguro() {}

    public Seguro(Long id, String nome, String descricao, String caracteristicas, BigDecimal valorBase) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.caracteristicas = caracteristicas;
        this.valorBase = valorBase != null ? valorBase : BigDecimal.ZERO;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getCaracteristicas() {
        return caracteristicas;
    }

    public void setCaracteristicas(String caracteristicas) {
        this.caracteristicas = caracteristicas;
    }

    public BigDecimal getValorBase() {
        return valorBase;
    }

    public void setValorBase(BigDecimal valorBase) {
        this.valorBase = valorBase;
    }

    public List<Cobertura> getCoberturas() {
        return coberturas;
    }

    public void setCoberturas(List<Cobertura> coberturas) {
        this.coberturas = coberturas;
    }

    public void addCobertura(Cobertura cobertura) {
        this.coberturas.add(cobertura);
        cobertura.setSeguro(this);
    }
}
