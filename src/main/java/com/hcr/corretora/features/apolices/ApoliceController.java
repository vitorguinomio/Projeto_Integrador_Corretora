package com.hcr.corretora.features.apolices;

import com.hcr.corretora.core.security.UsuarioLogado;

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
    private final UsuarioLogado usuarioLogado;

    public ApoliceController(ApoliceService apoliceService, UsuarioLogado usuarioLogado) {
        this.apoliceService = apoliceService;
        this.usuarioLogado = usuarioLogado;
    }

    @GetMapping
    public ResponseEntity<List<ApoliceResponse>> listar(
            @RequestParam(required = false) String termo,
            @RequestParam(required = false) String situacao,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long corretorId
    ) {
        // Cliente enxerga apenas as próprias apólices
        Long filtroCliente = usuarioLogado.restringirClienteId(clienteId);
        return ResponseEntity.ok(apoliceService.pesquisar(termo, situacao, filtroCliente, corretorId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApoliceResponse> buscarPorId(@PathVariable Long id) {
        ApoliceResponse apolice = apoliceService.buscarPorId(id);
        usuarioLogado.exigirAcessoAoCliente(apolice.clienteId());
        return ResponseEntity.ok(apolice);
    }

    @PostMapping
    public ResponseEntity<ApoliceResponse> criar(@Valid @RequestBody ApoliceRequest request) {
        ApoliceResponse criada = apoliceService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(criada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApoliceResponse> atualizar(@PathVariable Long id, @Valid @RequestBody AtualizacaoApoliceRequest request) {
        return ResponseEntity.ok(apoliceService.atualizar(id, request));
    }

    @PostMapping("/{id}/renovar")
    public ResponseEntity<ApoliceResponse> renovar(@PathVariable Long id, @Valid @RequestBody RenovacaoRequest request) {
        return ResponseEntity.ok(apoliceService.renovar(id, request));
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<ApoliceResponse> cancelar(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CancelamentoRequest request
    ) {
        return ResponseEntity.ok(apoliceService.cancelar(id, request != null ? request.motivo() : null));
    }

    @GetMapping("/alertas-vencimento")
    public ResponseEntity<List<ApoliceResponse>> listarAlertasVencimento(@RequestParam(defaultValue = "30") int dias) {
        return ResponseEntity.ok(apoliceService.listarAlertasVencimento(dias));
    }

    @GetMapping("/{id}/parcelas")
    public ResponseEntity<List<ParcelaResponse>> listarParcelas(@PathVariable Long id) {
        usuarioLogado.exigirAcessoAoCliente(apoliceService.buscarPorId(id).clienteId());
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
