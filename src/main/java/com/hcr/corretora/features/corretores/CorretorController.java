package com.hcr.corretora.features.corretores;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/corretores")
public class CorretorController {

    private final CorretorService corretorService;

    public CorretorController(CorretorService corretorService) {
        this.corretorService = corretorService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar() {
        List<Map<String, Object>> corretores = corretorService.listarTodos();
        return ResponseEntity.ok(corretores);
    }
}
