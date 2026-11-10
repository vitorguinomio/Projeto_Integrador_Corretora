package com.hcr.corretora.features.relatorios;

import com.hcr.corretora.features.relatorios.dto.RelatorioApoliceItem;
import com.hcr.corretora.features.relatorios.dto.RelatorioClienteItem;
import com.hcr.corretora.features.relatorios.dto.RelatorioCorretorItem;
import com.hcr.corretora.features.relatorios.dto.RelatorioSeguroItem;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/relatorios")
public class RelatorioController {

    private final RelatorioService relatorioService;

    public RelatorioController(RelatorioService relatorioService) {
        this.relatorioService = relatorioService;
    }

    @GetMapping("/clientes")
    public ResponseEntity<List<RelatorioClienteItem>> relatorioClientes() {
        return ResponseEntity.ok(relatorioService.relatorioClientes());
    }

    @GetMapping("/corretores")
    public ResponseEntity<List<RelatorioCorretorItem>> relatorioCorretores() {
        return ResponseEntity.ok(relatorioService.relatorioCorretores());
    }

    @GetMapping("/seguros")
    public ResponseEntity<List<RelatorioSeguroItem>> relatorioSeguros() {
        return ResponseEntity.ok(relatorioService.relatorioSeguros());
    }

    @GetMapping("/apolices")
    public ResponseEntity<List<RelatorioApoliceItem>> relatorioApolices(@RequestParam(required = false) String situacao) {
        return ResponseEntity.ok(relatorioService.relatorioApolices(situacao));
    }
}
