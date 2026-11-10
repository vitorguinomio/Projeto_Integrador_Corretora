package com.hcr.corretora.features.corretores;

import com.hcr.corretora.features.usuarios.Usuario;
import jakarta.persistence.*;

@Entity
@Table(name = "corretor")
public class Corretor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(name = "dados_profissionais", nullable = false, length = 50)
    private String dadosProfissionais;

    @Column(nullable = false, length = 20)
    private String status = "ATIVO";

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fk_usuario_id", unique = true)
    private Usuario usuario;

    public Corretor() {}

    public Corretor(Long id, String nome, String dadosProfissionais, String status, Usuario usuario) {
        this.id = id;
        this.nome = nome;
        this.dadosProfissionais = dadosProfissionais;
        this.status = (status != null && !status.isBlank()) ? status : "ATIVO";
        this.usuario = usuario;
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

    public String getDadosProfissionais() {
        return dadosProfissionais;
    }

    public void setDadosProfissionais(String dadosProfissionais) {
        this.dadosProfissionais = dadosProfissionais;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }
}
