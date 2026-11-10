package com.hcr.corretora.features.administradores;

import com.hcr.corretora.features.administradores.dto.AdministradorRequest;
import com.hcr.corretora.features.administradores.dto.AdministradorResponse;
import com.hcr.corretora.features.usuarios.Usuario;
import com.hcr.corretora.features.usuarios.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdministradorService {

    private final AdministradorRepository administradorRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AdministradorService(
            AdministradorRepository administradorRepository,
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.administradorRepository = administradorRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<AdministradorResponse> listarTodos() {
        return administradorRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public AdministradorResponse buscarPorId(Long id) {
        Administrador admin = administradorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Administrador não encontrado com id: " + id));
        return toResponse(admin);
    }

    @Transactional
    public AdministradorResponse criar(AdministradorRequest request) {
        String email = request.email().trim().toLowerCase();
        if (usuarioRepository.existsByLoginEmail(email)) {
            throw new IllegalArgumentException("Já existe um usuário com este e-mail: " + email);
        }

        String senhaPlain = (request.senha() != null && !request.senha().isBlank()) ? request.senha() : "admin123";
        Usuario usuario = new Usuario(
                null,
                email,
                passwordEncoder.encode(senhaPlain),
                "ADMINISTRADOR",
                "ATIVO"
        );
        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        Administrador admin = new Administrador(null, request.nome(), request.cargo(), usuarioSalvo);
        Administrador salvo = administradorRepository.save(admin);
        return toResponse(salvo);
    }

    @Transactional
    public AdministradorResponse atualizar(Long id, AdministradorRequest request) {
        Administrador admin = administradorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Administrador não encontrado com id: " + id));

        admin.setNome(request.nome());
        admin.setCargo(request.cargo());

        if (request.senha() != null && !request.senha().isBlank()) {
            admin.getUsuario().setSenha(passwordEncoder.encode(request.senha()));
            usuarioRepository.save(admin.getUsuario());
        }

        return toResponse(administradorRepository.save(admin));
    }

    public AdministradorResponse toResponse(Administrador admin) {
        return new AdministradorResponse(
                admin.getId(),
                admin.getNome(),
                admin.getCargo(),
                admin.getUsuario() != null ? admin.getUsuario().getId() : null,
                admin.getUsuario() != null ? admin.getUsuario().getLoginEmail() : null,
                admin.getUsuario() != null ? admin.getUsuario().getStatus() : "ATIVO"
        );
    }
}
