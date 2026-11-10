package com.hcr.corretora.features.usuarios;

import com.hcr.corretora.features.usuarios.dto.UsuarioCreateRequest;
import com.hcr.corretora.features.usuarios.dto.UsuarioResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UsuarioResponse> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public UsuarioResponse buscarPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado com id: " + id));
        return toResponse(usuario);
    }

    public Usuario buscarEntidadePorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado com id: " + id));
    }

    public Usuario buscarPorEmail(String email) {
        return usuarioRepository.findByLoginEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado com o e-mail: " + email));
    }

    @Transactional
    public UsuarioResponse criar(UsuarioCreateRequest request) {
        if (usuarioRepository.existsByLoginEmail(request.loginEmail())) {
            throw new IllegalArgumentException("Já existe um usuário com o e-mail informado: " + request.loginEmail());
        }

        Usuario usuario = new Usuario(
                null,
                request.loginEmail().trim().toLowerCase(),
                passwordEncoder.encode(request.senha()),
                request.perfilAcesso().toUpperCase(),
                request.status() != null ? request.status().toUpperCase() : "ATIVO"
        );

        Usuario salvo = usuarioRepository.save(usuario);
        return toResponse(salvo);
    }

    @Transactional
    public UsuarioResponse alterarStatus(Long id, String novoStatus) {
        Usuario usuario = buscarEntidadePorId(id);
        usuario.setStatus(novoStatus.toUpperCase());
        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse alterarPerfil(Long id, String novoPerfil) {
        Usuario usuario = buscarEntidadePorId(id);
        usuario.setPerfilAcesso(novoPerfil.toUpperCase());
        return toResponse(usuarioRepository.save(usuario));
    }

    public UsuarioResponse toResponse(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getLoginEmail(),
                usuario.getPerfilAcesso(),
                usuario.getStatus()
        );
    }
}
