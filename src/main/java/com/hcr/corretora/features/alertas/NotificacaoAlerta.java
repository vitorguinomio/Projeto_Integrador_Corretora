package com.hcr.corretora.features.alertas;

import com.hcr.corretora.features.usuarios.Usuario;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notificacao_alerta")
public class NotificacaoAlerta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String assunto;

    @Column(nullable = false, length = 20)
    private String status = "PENDENTE";

    @Column(name = "data_criacao")
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fk_usuario_id", nullable = false)
    private Usuario usuario;

    public NotificacaoAlerta() {}

    public NotificacaoAlerta(Long id, String assunto, String status, LocalDateTime dataCriacao, Usuario usuario) {
        this.id = id;
        this.assunto = assunto;
        this.status = (status != null && !status.isBlank()) ? status : "PENDENTE";
        this.dataCriacao = dataCriacao != null ? dataCriacao : LocalDateTime.now();
        this.usuario = usuario;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAssunto() {
        return assunto;
    }

    public void setAssunto(String assunto) {
        this.assunto = assunto;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(LocalDateTime dataCriacao) {
        this.dataCriacao = dataCriacao;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }
}
