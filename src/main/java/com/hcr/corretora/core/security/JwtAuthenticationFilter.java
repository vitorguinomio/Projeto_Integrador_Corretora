package com.hcr.corretora.core.security;

import com.hcr.corretora.features.usuarios.Usuario;
import com.hcr.corretora.features.usuarios.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenService jwtTokenService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthenticationFilter(JwtTokenService jwtTokenService, UsuarioRepository usuarioRepository) {
        this.jwtTokenService = jwtTokenService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();

            if (jwtTokenService.validateToken(token)) {
                Map<String, Object> claims = jwtTokenService.getClaims(token);
                String email = (String) claims.get("sub");

                // O perfil e o status vêm do banco, não do token: um usuário desativado perde o
                // acesso na hora e uma mudança de perfil vale imediatamente (EU21 / RF29)
                Usuario usuario = email != null ? usuarioRepository.findByLoginEmail(email).orElse(null) : null;
                boolean ativo = usuario != null && "ATIVO".equalsIgnoreCase(usuario.getStatus());
                String perfil = usuario != null ? usuario.getPerfilAcesso() : null;

                if (ativo && SecurityContextHolder.getContext().getAuthentication() == null) {
                    String roleName = perfil != null && perfil.startsWith("ROLE_") ? perfil : "ROLE_" + (perfil != null ? perfil : "CLIENTE");
                    var authorities = List.of(new SimpleGrantedAuthority(roleName));

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            authorities
                    );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
