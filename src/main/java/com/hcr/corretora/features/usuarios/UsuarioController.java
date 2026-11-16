package com.hcr.corretora.features.usuarios;

import com.hcr.corretora.features.usuarios.dto.UsuarioCreateRequest;
import com.hcr.corretora.features.usuarios.dto.UsuarioResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public ResponseEntity<List<UsuarioResponse>> listar() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<UsuarioResponse> criar(@Valid @RequestBody UsuarioCreateRequest request) {
        UsuarioResponse criado = usuarioService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @RequestMapping(value = "/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<UsuarioResponse> alterarStatus(
            @PathVariable Long id,
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        String novoStatus = null;
        if (ativo != null) {
            novoStatus = ativo ? "ATIVO" : "INATIVO";
        } else if (status != null && !status.isBlank()) {
            novoStatus = status;
        } else if (body != null) {
            if (body.get("ativo") != null) {
                boolean isAtivo = Boolean.parseBoolean(String.valueOf(body.get("ativo")));
                novoStatus = isAtivo ? "ATIVO" : "INATIVO";
            } else if (body.get("status") != null) {
                novoStatus = String.valueOf(body.get("status"));
            }
        }
        if (novoStatus == null) {
            Usuario atual = usuarioService.buscarEntidadePorId(id);
            novoStatus = "ATIVO".equalsIgnoreCase(atual.getStatus()) ? "INATIVO" : "ATIVO";
        }
        return ResponseEntity.ok(usuarioService.alterarStatus(id, novoStatus));
    }

    @RequestMapping(value = "/{id}/perfil", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<UsuarioResponse> alterarPerfil(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String perfil = body.getOrDefault("perfil", body.getOrDefault("perfilAcesso", "CLIENTE"));
        return ResponseEntity.ok(usuarioService.alterarPerfil(id, perfil));
    }
}
