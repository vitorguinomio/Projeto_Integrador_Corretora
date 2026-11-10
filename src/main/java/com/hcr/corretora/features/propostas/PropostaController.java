package com.hcr.corretora.features.propostas;

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

    public PropostaController(PropostaService propostaService) {
        this.propostaService = propostaService;
    }

    @GetMapping
    public ResponseEntity<List<PropostaResponse>> listar() {
        return ResponseEntity.ok(propostaService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PropostaResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(propostaService.buscarPorId(id));
    }

    @GetMapping("/cotacao/{cotacaoId}")
    public ResponseEntity<PropostaResponse> buscarPorCotacaoId(@PathVariable Long cotacaoId) {
        return ResponseEntity.ok(propostaService.buscarPorCotacaoId(cotacaoId));
    }

    @PostMapping
    public ResponseEntity<PropostaResponse> criar(@Valid @RequestBody PropostaRequest request) {
        PropostaResponse criado = propostaService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @PostMapping("/{id}/aceitar")
    public ResponseEntity<PropostaResponse> aceitar(@PathVariable Long id) {
        return ResponseEntity.ok(propostaService.aceitar(id));
    }

    @PostMapping("/{id}/recusar")
    public ResponseEntity<PropostaResponse> recusar(@PathVariable Long id) {
        return ResponseEntity.ok(propostaService.recusar(id));
    }
}
