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

    @PatchMapping("/{id}/status")
    public ResponseEntity<UsuarioResponse> alterarStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "ATIVO");
        return ResponseEntity.ok(usuarioService.alterarStatus(id, status));
    }

    @PatchMapping("/{id}/perfil")
    public ResponseEntity<UsuarioResponse> alterarPerfil(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String perfil = body.getOrDefault("perfil", "CLIENTE");
        return ResponseEntity.ok(usuarioService.alterarPerfil(id, perfil));
    }
}
