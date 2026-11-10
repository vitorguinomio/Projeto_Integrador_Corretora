package com.hcr.corretora.features.corretores;

import com.hcr.corretora.features.corretores.dto.CorretorRequest;
import com.hcr.corretora.features.corretores.dto.CorretorResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/corretores")
public class CorretorController {

    private final CorretorService corretorService;

    public CorretorController(CorretorService corretorService) {
        this.corretorService = corretorService;
    }

    @GetMapping
    public ResponseEntity<List<CorretorResponse>> listar() {
        return ResponseEntity.ok(corretorService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CorretorResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(corretorService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<CorretorResponse> criar(@Valid @RequestBody CorretorRequest request) {
        CorretorResponse criado = corretorService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CorretorResponse> atualizar(@PathVariable Long id, @Valid @RequestBody CorretorRequest request) {
        return ResponseEntity.ok(corretorService.atualizar(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CorretorResponse> alternarStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "ATIVO");
        return ResponseEntity.ok(corretorService.alternarStatus(id, status));
    }
}
