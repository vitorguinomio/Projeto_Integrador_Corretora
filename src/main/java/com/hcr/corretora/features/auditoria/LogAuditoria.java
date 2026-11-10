package com.hcr.corretora.features.auditoria;

import com.hcr.corretora.features.usuarios.Usuario;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "log_auditoria")
public class LogAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "acao_realizada", nullable = false, length = 255)
    private String acaoRealizada;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora = LocalDateTime.now();

    @Column(name = "tabela_afetada", nullable = false, length = 50)
    private String tabelaAfetada;

    @Column(name = "ip_origem", length = 45)
    private String ipOrigem;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fk_usuario_id")
    private Usuario usuario;

    public LogAuditoria() {}

    public LogAuditoria(Long id, String acaoRealizada, LocalDateTime dataHora, String tabelaAfetada, String ipOrigem, Usuario usuario) {
        this.id = id;
        this.acaoRealizada = acaoRealizada;
        this.dataHora = dataHora != null ? dataHora : LocalDateTime.now();
        this.tabelaAfetada = tabelaAfetada;
        this.ipOrigem = ipOrigem;
        this.usuario = usuario;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAcaoRealizada() {
        return acaoRealizada;
    }

    public void setAcaoRealizada(String acaoRealizada) {
        this.acaoRealizada = acaoRealizada;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }

    public String getTabelaAfetada() {
        return tabelaAfetada;
    }

    public void setTabelaAfetada(String tabelaAfetada) {
        this.tabelaAfetada = tabelaAfetada;
    }

    public String getIpOrigem() {
        return ipOrigem;
    }

    public void setIpOrigem(String ipOrigem) {
        this.ipOrigem = ipOrigem;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }
}
