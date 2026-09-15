package com.hcr.corretora.features.corretores;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class CorretorService {

    public List<Map<String, Object>> listarTodos() {
        return List.of(
                Map.of("id", 1L, "nome", "Carlos Silva", "matricula", "COR-1001", "email", "carlos.silva@corretora.com"),
                Map.of("id", 2L, "nome", "Ana Paula Santos", "matricula", "COR-1002", "email", "ana.santos@corretora.com")
        );
    }
}
