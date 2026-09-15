package com.hcr.corretora.features.auth;

import com.hcr.corretora.features.auth.dto.LoginRequest;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthService {

    public Map<String, Object> autenticar(LoginRequest loginRequest) {
        // Stub inicial de autenticação
        return Map.of(
                "token", "stub-jwt-token-placeholder",
                "tipo", "Bearer",
                "usuario", loginRequest.email(),
                "status", "AUTENTICADO"
        );
    }
}
