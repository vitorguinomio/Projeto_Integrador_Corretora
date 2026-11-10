package com.hcr.corretora.features.administradores;

import com.hcr.corretora.features.administradores.dto.AdministradorRequest;
import com.hcr.corretora.features.administradores.dto.AdministradorResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/administradores")
public class AdministradorController {

    private final AdministradorService administradorService;

    public AdministradorController(AdministradorService administradorService) {
        this.administradorService = administradorService;
    }

    @GetMapping
    public ResponseEntity<List<AdministradorResponse>> listar() {
        return ResponseEntity.ok(administradorService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdministradorResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(administradorService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<AdministradorResponse> criar(@Valid @RequestBody AdministradorRequest request) {
        AdministradorResponse criado = administradorService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdministradorResponse> atualizar(@PathVariable Long id, @Valid @RequestBody AdministradorRequest request) {
        return ResponseEntity.ok(administradorService.atualizar(id, request));
    }
}
