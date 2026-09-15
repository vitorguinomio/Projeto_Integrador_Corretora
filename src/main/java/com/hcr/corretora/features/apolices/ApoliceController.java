package com.hcr.corretora.features.apolices;

import com.hcr.corretora.features.apolices.dto.ApoliceRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/apolices")
public class ApoliceController {

    private final ApoliceService apoliceService;

    public ApoliceController(ApoliceService apoliceService) {
        this.apoliceService = apoliceService;
    }

    @GetMapping
    public ResponseEntity<List<Apolice>> listar() {
        List<Apolice> apolices = apoliceService.listarTodas();
        return ResponseEntity.ok(apolices);
    }

    @PostMapping
    public ResponseEntity<Apolice> criar(@Valid @RequestBody ApoliceRequest request) {
        Apolice criada = apoliceService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(criada);
    }
}
