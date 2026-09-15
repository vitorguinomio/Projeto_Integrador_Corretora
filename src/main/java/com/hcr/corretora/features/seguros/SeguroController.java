package com.hcr.corretora.features.seguros;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/seguros")
public class SeguroController {

    private final SeguroService seguroService;

    public SeguroController(SeguroService seguroService) {
        this.seguroService = seguroService;
    }

    @GetMapping
    public ResponseEntity<List<Seguro>> listar() {
        List<Seguro> seguros = seguroService.listarTodos();
        return ResponseEntity.ok(seguros);
    }
}
