package com.hcr.corretora.features.auditoria;

import com.hcr.corretora.features.auditoria.dto.LogAuditoriaResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/auditoria")
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    public AuditoriaController(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @GetMapping
    public ResponseEntity<List<LogAuditoriaResponse>> listar() {
        return ResponseEntity.ok(auditoriaService.listarTodos());
    }
}
