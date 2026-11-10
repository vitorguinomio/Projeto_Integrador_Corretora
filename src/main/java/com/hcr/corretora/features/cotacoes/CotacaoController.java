package com.hcr.corretora.features.cotacoes;

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

    public CotacaoController(CotacaoService cotacaoService) {
        this.cotacaoService = cotacaoService;
    }

    @GetMapping
    public ResponseEntity<List<CotacaoResponse>> listar(
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long corretorId,
            @RequestParam(required = false) String situacao
    ) {
        return ResponseEntity.ok(cotacaoService.listar(clienteId, corretorId, situacao));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CotacaoResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(cotacaoService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<CotacaoResponse> criar(@Valid @RequestBody CotacaoRequest request) {
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
