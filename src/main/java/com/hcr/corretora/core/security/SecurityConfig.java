package com.hcr.corretora.core.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.time.Instant;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final String ADMIN = UsuarioLogado.ADMINISTRADOR;
    private static final String CORRETOR = UsuarioLogado.CORRETOR;
    private static final String CLIENTE = UsuarioLogado.CLIENTE;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Público: login/cadastro e catálogo de seguros
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/seguros/**").permitAll()

                        // Somente administrador
                        .requestMatchers("/usuarios/**", "/administradores/**", "/auditoria/**", "/relatorios/**")
                            .hasRole(ADMIN)
                        .requestMatchers("/seguros/**").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/corretores/**").hasAnyRole(ADMIN, CORRETOR)
                        .requestMatchers("/corretores/**").hasRole(ADMIN)
                        .requestMatchers("/dashboard/**").hasAnyRole(ADMIN, CORRETOR)

                        // Clientes: equipe; o cliente vê apenas o próprio cadastro (checado no controller)
                        .requestMatchers(HttpMethod.GET, "/clientes/*", "/clientes/*/historico").authenticated()
                        .requestMatchers("/clientes/**").hasAnyRole(ADMIN, CORRETOR)

                        // Apólices: consulta para todos (cliente só as próprias); operações pela equipe
                        .requestMatchers(HttpMethod.GET, "/apolices/alertas-vencimento").hasAnyRole(ADMIN, CORRETOR)
                        .requestMatchers(HttpMethod.GET, "/apolices/**").authenticated()
                        .requestMatchers("/apolices/**").hasAnyRole(ADMIN, CORRETOR)

                        // Cotações: o cliente solicita e acompanha as próprias
                        .requestMatchers(HttpMethod.GET, "/cotacoes/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/cotacoes").authenticated()
                        .requestMatchers("/cotacoes/**").hasAnyRole(ADMIN, CORRETOR)

                        // Propostas: a equipe elabora; o aceite/recusa é do cliente
                        .requestMatchers(HttpMethod.POST, "/propostas/*/aceitar", "/propostas/*/recusar")
                            .hasAnyRole(ADMIN, CLIENTE)
                        .requestMatchers(HttpMethod.GET, "/propostas/**").authenticated()
                        .requestMatchers("/propostas/**").hasAnyRole(ADMIN, CORRETOR)

                        // Alertas: cada usuário lê os próprios; a equipe pode criar
                        .requestMatchers(HttpMethod.POST, "/alertas").hasAnyRole(ADMIN, CORRETOR)

                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        // Sem token (ou token inválido/expirado) -> 401; sem permissão -> 403
                        .authenticationEntryPoint((request, response, e) -> escreverErro(response, 401, "Unauthorized",
                                "Faça login para acessar este recurso."))
                        .accessDeniedHandler((request, response, e) -> escreverErro(response, 403, "Forbidden",
                                "Seu perfil não tem permissão para realizar esta operação."))
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private static void escreverErro(HttpServletResponse response, int status, String erro, String mensagem)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(String.format(
                "{\"timestamp\":\"%s\",\"status\":%d,\"error\":\"%s\",\"message\":\"%s\"}",
                Instant.now(), status, erro, mensagem));
    }
}
