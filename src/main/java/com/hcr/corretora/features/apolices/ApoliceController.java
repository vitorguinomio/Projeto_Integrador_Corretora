package com.hcr.corretora.features.apolices;

import com.hcr.corretora.features.apolices.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/apolices")
public class ApoliceController {

    private final ApoliceService apoliceService;

    public ApoliceController(ApoliceService apoliceService) {
        this.apoliceService = apoliceService;
    }

    @GetMapping
    public ResponseEntity<List<ApoliceResponse>> listar(
            @RequestParam(required = false) String termo,
            @RequestParam(required = false) String situacao,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long corretorId
    ) {
        return ResponseEntity.ok(apoliceService.pesquisar(termo, situacao, clienteId, corretorId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApoliceResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(apoliceService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<ApoliceResponse> criar(@Valid @RequestBody ApoliceRequest request) {
        ApoliceResponse criada = apoliceService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(criada);
    }

    @PostMapping("/{id}/renovar")
    public ResponseEntity<ApoliceResponse> renovar(@PathVariable Long id, @Valid @RequestBody RenovacaoRequest request) {
        return ResponseEntity.ok(apoliceService.renovar(id, request));
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<ApoliceResponse> cancelar(@PathVariable Long id) {
        return ResponseEntity.ok(apoliceService.cancelar(id));
    }

    @GetMapping("/alertas-vencimento")
    public ResponseEntity<List<ApoliceResponse>> listarAlertasVencimento(@RequestParam(defaultValue = "30") int dias) {
        return ResponseEntity.ok(apoliceService.listarAlertasVencimento(dias));
    }

    @GetMapping("/{id}/parcelas")
    public ResponseEntity<List<ParcelaResponse>> listarParcelas(@PathVariable Long id) {
        return ResponseEntity.ok(apoliceService.listarParcelasPorApolice(id));
    }

    @PatchMapping("/parcelas/{parcelaId}")
    public ResponseEntity<ParcelaResponse> atualizarParcela(
            @PathVariable Long parcelaId,
            @Valid @RequestBody AtualizarParcelaRequest request
    ) {
        return ResponseEntity.ok(apoliceService.atualizarStatusParcela(parcelaId, request.status()));
    }
}
