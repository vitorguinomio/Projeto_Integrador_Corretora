package com.hcr.corretora.features.cotacoes;

import com.hcr.corretora.core.security.UsuarioLogado;

import com.hcr.corretora.features.cotacoes.dto.CotacaoRequest;
import com.hcr.corretora.features.cotacoes.dto.CotacaoResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/cotacoes")
public class CotacaoController {

    private final CotacaoService cotacaoService;
    private final UsuarioLogado usuarioLogado;

    public CotacaoController(CotacaoService cotacaoService, UsuarioLogado usuarioLogado) {
        this.cotacaoService = cotacaoService;
        this.usuarioLogado = usuarioLogado;
    }

    @GetMapping
    public ResponseEntity<List<CotacaoResponse>> listar(
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long corretorId,
            @RequestParam(required = false) String situacao
    ) {
        return ResponseEntity.ok(cotacaoService.listar(usuarioLogado.restringirClienteId(clienteId), corretorId, situacao));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CotacaoResponse> buscarPorId(@PathVariable Long id) {
        CotacaoResponse cotacao = cotacaoService.buscarPorId(id);
        usuarioLogado.exigirAcessoAoCliente(cotacao.clienteId());
        return ResponseEntity.ok(cotacao);
    }

    @PostMapping
    public ResponseEntity<CotacaoResponse> criar(@Valid @RequestBody CotacaoRequest request) {
        if (usuarioLogado.isCliente()) {
            // O cliente só solicita cotação para si mesmo e não escolhe corretor nem situação
            request = new CotacaoRequest(usuarioLogado.clienteId(), null, request.seguroId(), request.valor(), "SOLICITADA");
        }
        CotacaoResponse criado = cotacaoService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @PatchMapping("/{id}/situacao")
    public ResponseEntity<CotacaoResponse> atualizarSituacao(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        String situacao = (String) body.get("situacao");
        Long corretorId = body.get("corretorId") != null ? Long.valueOf(body.get("corretorId").toString()) : null;
        return ResponseEntity.ok(cotacaoService.atualizarSituacao(id, situacao, corretorId));
    }
}
