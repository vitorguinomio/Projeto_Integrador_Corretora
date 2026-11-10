package com.hcr.corretora.features.seguros;

import com.hcr.corretora.features.seguros.dto.CoberturaDto;
import com.hcr.corretora.features.seguros.dto.SeguroRequest;
import com.hcr.corretora.features.seguros.dto.SeguroResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/seguros")
public class SeguroController {

    private final SeguroService seguroService;

    public SeguroController(SeguroService seguroService) {
        this.seguroService = seguroService;
    }

    @GetMapping
    public ResponseEntity<List<SeguroResponse>> listar() {
        return ResponseEntity.ok(seguroService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SeguroResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(seguroService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<SeguroResponse> criar(@Valid @RequestBody SeguroRequest request) {
        SeguroResponse criado = seguroService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SeguroResponse> atualizar(@PathVariable Long id, @Valid @RequestBody SeguroRequest request) {
        return ResponseEntity.ok(seguroService.atualizar(id, request));
    }

    @PostMapping("/{id}/coberturas")
    public ResponseEntity<CoberturaDto> adicionarCobertura(@PathVariable Long id, @Valid @RequestBody CoberturaDto dto) {
        CoberturaDto criada = seguroService.adicionarCobertura(id, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(criada);
    }

    @DeleteMapping("/coberturas/{coberturaId}")
    public ResponseEntity<Void> removerCobertura(@PathVariable Long coberturaId) {
        seguroService.removerCobertura(coberturaId);
        return ResponseEntity.noContent().build();
    }
}
