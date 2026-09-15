package com.hcr.corretora.features.seguros;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class SeguroService {

    public List<Seguro> listarTodos() {
        // Stub para listagem de seguros
        return List.of(
                new Seguro(1L, "Seguro Auto Básico", "Proteção contra roubo e colisão", "AUTOMOVEL", new BigDecimal("1200.00"), true),
                new Seguro(2L, "Seguro Residencial", "Cobertura contra incêndio e danos elétricos", "RESIDENCIAL", new BigDecimal("650.00"), true),
                new Seguro(3L, "Seguro de Vida Individual", "Proteção financeira e assistência funeral", "VIDA", new BigDecimal("450.00"), true)
        );
    }
}
