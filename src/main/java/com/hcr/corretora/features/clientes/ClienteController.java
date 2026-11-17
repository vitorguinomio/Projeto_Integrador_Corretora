package com.hcr.corretora.features.clientes;

import com.hcr.corretora.core.security.UsuarioLogado;

import com.hcr.corretora.features.clientes.dto.ClienteHistoricoResponse;
import com.hcr.corretora.features.clientes.dto.ClienteRequest;
import com.hcr.corretora.features.clientes.dto.ClienteResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    private final ClienteService clienteService;
    private final UsuarioLogado usuarioLogado;

    public ClienteController(ClienteService clienteService, UsuarioLogado usuarioLogado) {
        this.clienteService = clienteService;
        this.usuarioLogado = usuarioLogado;
    }

    @GetMapping
    public ResponseEntity<List<ClienteResponse>> listar(@RequestParam(required = false) String busca) {
        if (busca != null && !busca.isBlank()) {
            return ResponseEntity.ok(clienteService.buscar(busca));
        }
        return ResponseEntity.ok(clienteService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteResponse> buscarPorId(@PathVariable Long id) {
        usuarioLogado.exigirAcessoAoCliente(id);
        return ResponseEntity.ok(clienteService.buscarPorId(id));
    }

    @GetMapping("/{id}/historico")
    public ResponseEntity<ClienteHistoricoResponse> buscarHistorico(@PathVariable Long id) {
        usuarioLogado.exigirAcessoAoCliente(id);
        return ResponseEntity.ok(clienteService.buscarHistorico(id));
    }

    @PostMapping
    public ResponseEntity<ClienteResponse> criar(@Valid @RequestBody ClienteRequest request) {
        if (request.corretorId() == null && usuarioLogado.possuiPerfil(UsuarioLogado.CORRETOR)) {
            request = new ClienteRequest(request.nome(), request.cpfCnpj(), request.dataNasc(), request.email(),
                    request.senhaAcesso(), request.enderecos(), request.telefones(), usuarioLogado.corretorId());
        }
        ClienteResponse criado = clienteService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponse> atualizar(@PathVariable Long id, @Valid @RequestBody ClienteRequest request) {
        return ResponseEntity.ok(clienteService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        clienteService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
