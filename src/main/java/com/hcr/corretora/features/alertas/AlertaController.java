package com.hcr.corretora.features.alertas;

import com.hcr.corretora.features.alertas.dto.CriarNotificacaoRequest;
import com.hcr.corretora.features.alertas.dto.NotificacaoResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/alertas")
public class AlertaController {

    private final AlertaService alertaService;

    public AlertaController(AlertaService alertaService) {
        this.alertaService = alertaService;
    }

    @GetMapping
    public ResponseEntity<List<NotificacaoResponse>> listar(
            @RequestParam(required = false) Long usuarioId,
            Authentication authentication
    ) {
        if (usuarioId != null) {
            return ResponseEntity.ok(alertaService.listarPorUsuarioId(usuarioId));
        }
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(alertaService.listarPorUsuario(email));
    }

    @PostMapping
    public ResponseEntity<NotificacaoResponse> criar(@Valid @RequestBody CriarNotificacaoRequest request) {
        NotificacaoResponse criada = alertaService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(criada);
    }

    @PatchMapping("/{id}/ler")
    public ResponseEntity<NotificacaoResponse> marcarComoLida(@PathVariable Long id) {
        return ResponseEntity.ok(alertaService.marcarComoLida(id));
    }
}
