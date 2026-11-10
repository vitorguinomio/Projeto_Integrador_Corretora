package com.hcr.corretora.features.clientes;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "telefone")
public class Telefone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 2)
    private String ddd;

    @Column(nullable = false, length = 15)
    private String numero;

    @Column(nullable = false, length = 20)
    private String tipo = "CELULAR";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fk_cliente_id", nullable = false)
    @JsonBackReference
    private Cliente cliente;

    public Telefone() {}

    public Telefone(Long id, String ddd, String numero, String tipo, Cliente cliente) {
        this.id = id;
        this.ddd = ddd;
        this.numero = numero;
        this.tipo = (tipo != null && !tipo.isBlank()) ? tipo : "CELULAR";
        this.cliente = cliente;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDdd() {
        return ddd;
    }

    public void setDdd(String ddd) {
        this.ddd = ddd;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }
}
