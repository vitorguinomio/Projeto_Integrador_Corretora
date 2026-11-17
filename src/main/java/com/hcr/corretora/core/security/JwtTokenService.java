package com.hcr.corretora.core.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtTokenService {

    private final String secret;
    private final long expirationSeconds;
    private final ObjectMapper objectMapper;

    private static final Logger log = LoggerFactory.getLogger(JwtTokenService.class);
    private static final int TAMANHO_MINIMO_CHAVE = 32;

    /**
     * A chave de assinatura vem da variável de ambiente JWT_SECRET (app.jwt.secret).
     * - Ausente: gera uma chave aleatória a cada inicialização (bom para desenvolvimento;
     *   os logins expiram quando a API reinicia).
     * - Curta demais: a aplicação não sobe, para não rodar com uma chave fraca.
     */
    public JwtTokenService(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.expiration-seconds:86400}") long expirationSeconds,
            ObjectMapper objectMapper
    ) {
        this.secret = resolverChave(secret);
        this.expirationSeconds = expirationSeconds;
        this.objectMapper = objectMapper;
    }

    private static String resolverChave(String configurada) {
        if (configurada == null || configurada.isBlank()) {
            byte[] aleatoria = new byte[48];
            new SecureRandom().nextBytes(aleatoria);
            log.warn("JWT_SECRET não definida: usando uma chave aleatória temporária. Os logins deixam de valer quando "
                    + "a aplicação reinicia. Defina JWT_SECRET (veja o arquivo .env.example) em qualquer ambiente real.");
            return Base64.getEncoder().encodeToString(aleatoria);
        }
        if (configurada.length() < TAMANHO_MINIMO_CHAVE) {
            throw new IllegalStateException("JWT_SECRET muito curta (" + configurada.length() + " caracteres). Use pelo menos "
                    + TAMANHO_MINIMO_CHAVE + " caracteres aleatórios; para gerar: openssl rand -base64 48");
        }
        return configurada;
    }

    public String generateToken(Long userId, String email, String perfil) {
        try {
            Map<String, Object> header = Map.of(
                    "alg", "HS256",
                    "typ", "JWT"
            );

            long now = Instant.now().getEpochSecond();
            long exp = now + expirationSeconds;

            Map<String, Object> claims = new HashMap<>();
            claims.put("sub", email);
            claims.put("userId", userId);
            claims.put("perfil", perfil);
            claims.put("iat", now);
            claims.put("exp", exp);

            String encodedHeader = Base64.getUrlEncoder().withoutPadding().encodeToString(objectMapper.writeValueAsBytes(header));
            String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(objectMapper.writeValueAsBytes(claims));

            String content = encodedHeader + "." + encodedPayload;
            String signature = hmacSha256(content, secret);

            return content + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Falha ao gerar token JWT", e);
        }
    }

    public boolean validateToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }

            String content = parts[0] + "." + parts[1];
            String signature = parts[2];

            String expectedSignature = hmacSha256(content, secret);
            if (!MessageDigest.isEqual(signature.getBytes(StandardCharsets.UTF_8), expectedSignature.getBytes(StandardCharsets.UTF_8))) {
                return false;
            }

            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            Map<String, Object> claims = objectMapper.readValue(payloadBytes, new TypeReference<Map<String, Object>>() {});

            Number exp = (Number) claims.get("exp");
            if (exp != null && exp.longValue() < Instant.now().getEpochSecond()) {
                return false;
            }

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Map<String, Object> getClaims(String token) {
        try {
            String[] parts = token.split("\\.");
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            return objectMapper.readValue(payloadBytes, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new IllegalArgumentException("Token inválido para extração de claims", e);
        }
    }

    private String hmacSha256(String data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(hmacBytes);
    }
}
