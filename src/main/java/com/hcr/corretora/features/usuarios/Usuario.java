package com.hcr.corretora.features.usuarios;

import jakarta.persistence.*;

@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "login_email", nullable = false, unique = true, length = 100)
    private String loginEmail;

    @Column(nullable = false, length = 255)
    private String senha;

    @Column(name = "perfil_acesso", nullable = false, length = 20)
    private String perfilAcesso;

    @Column(nullable = false, length = 20)
    private String status = "ATIVO";

    public Usuario() {}

    public Usuario(Long id, String loginEmail, String senha, String perfilAcesso, String status) {
        this.id = id;
        this.loginEmail = loginEmail;
        this.senha = senha;
        this.perfilAcesso = perfilAcesso;
        this.status = (status != null && !status.isBlank()) ? status : "ATIVO";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLoginEmail() {
        return loginEmail;
    }

    public void setLoginEmail(String loginEmail) {
        this.loginEmail = loginEmail;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public String getPerfilAcesso() {
        return perfilAcesso;
    }

    public void setPerfilAcesso(String perfilAcesso) {
        this.perfilAcesso = perfilAcesso;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
