package com.hcr.corretora.features.administradores;

import com.hcr.corretora.features.usuarios.Usuario;
import jakarta.persistence.*;

@Entity
@Table(name = "administrador")
public class Administrador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 50)
    private String cargo;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fk_usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    public Administrador() {}

    public Administrador(Long id, String nome, String cargo, Usuario usuario) {
        this.id = id;
        this.nome = nome;
        this.cargo = cargo;
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

    public String getCargo() {
        return cargo;
    }

    public void setCargo(String cargo) {
        this.cargo = cargo;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }
}
