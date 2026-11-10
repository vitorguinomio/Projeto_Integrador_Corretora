package com.hcr.corretora.core.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtTokenService {

    private final String secret;
    private final long expirationSeconds;
    private final ObjectMapper objectMapper;

    public JwtTokenService(
            @Value("${app.jwt.secret:hcr-super-secret-key-corretora-projeto-integrador-2026-unieuro}") String secret,
            @Value("${app.jwt.expiration-seconds:86400}") long expirationSeconds,
            ObjectMapper objectMapper
    ) {
        this.secret = secret;
        this.expirationSeconds = expirationSeconds;
        this.objectMapper = objectMapper;
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
