package com.hcr.corretora.features.propostas;

import com.hcr.corretora.core.security.UsuarioLogado;

import com.hcr.corretora.features.propostas.dto.PropostaRequest;
import com.hcr.corretora.features.propostas.dto.PropostaResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/propostas")
public class PropostaController {

    private final PropostaService propostaService;
    private final UsuarioLogado usuarioLogado;

    public PropostaController(PropostaService propostaService, UsuarioLogado usuarioLogado) {
        this.propostaService = propostaService;
        this.usuarioLogado = usuarioLogado;
    }

    @GetMapping
    public ResponseEntity<List<PropostaResponse>> listar() {
        List<PropostaResponse> propostas = propostaService.listarTodas();
        if (usuarioLogado.isCliente()) {
            Long clienteId = usuarioLogado.clienteId();
            propostas = propostas.stream().filter(p -> clienteId.equals(p.clienteId())).toList();
        }
        return ResponseEntity.ok(propostas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PropostaResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(buscarComAcesso(id));
    }

    @GetMapping("/cotacao/{cotacaoId}")
    public ResponseEntity<PropostaResponse> buscarPorCotacaoId(@PathVariable Long cotacaoId) {
        PropostaResponse proposta = propostaService.buscarPorCotacaoId(cotacaoId);
        usuarioLogado.exigirAcessoAoCliente(proposta.clienteId());
        return ResponseEntity.ok(proposta);
    }

    @PostMapping
    public ResponseEntity<PropostaResponse> criar(@Valid @RequestBody PropostaRequest request) {
        PropostaResponse criado = propostaService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @PostMapping("/{id}/aceitar")
    public ResponseEntity<PropostaResponse> aceitar(@PathVariable Long id) {
        buscarComAcesso(id);
        return ResponseEntity.ok(propostaService.aceitar(id));
    }

    @PostMapping("/{id}/recusar")
    public ResponseEntity<PropostaResponse> recusar(@PathVariable Long id) {
        buscarComAcesso(id);
        return ResponseEntity.ok(propostaService.recusar(id));
    }

    /** Busca a proposta garantindo que um cliente só acesse as próprias. */
    private PropostaResponse buscarComAcesso(Long id) {
        PropostaResponse proposta = propostaService.buscarPorId(id);
        usuarioLogado.exigirAcessoAoCliente(proposta.clienteId());
        return proposta;
    }
}
