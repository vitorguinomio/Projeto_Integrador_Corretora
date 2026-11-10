package com.hcr.corretora.features.propostas;

import com.hcr.corretora.features.cotacoes.Cotacao;
import jakarta.persistence.*;

@Entity
@Table(name = "proposta")
public class Proposta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String condicoes;

    @Column(nullable = false, length = 50)
    private String situacao = "PENDENTE";

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fk_cotacao_id", nullable = false, unique = true)
    private Cotacao cotacao;

    public Proposta() {}

    public Proposta(Long id, String condicoes, String situacao, Cotacao cotacao) {
        this.id = id;
        this.condicoes = condicoes;
        this.situacao = (situacao != null && !situacao.isBlank()) ? situacao : "PENDENTE";
        this.cotacao = cotacao;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCondicoes() {
        return condicoes;
    }

    public void setCondicoes(String condicoes) {
        this.condicoes = condicoes;
    }

    public String getSituacao() {
        return situacao;
    }

    public void setSituacao(String situacao) {
        this.situacao = situacao;
    }

    public Cotacao getCotacao() {
        return cotacao;
    }

    public void setCotacao(Cotacao cotacao) {
        this.cotacao = cotacao;
    }
}
