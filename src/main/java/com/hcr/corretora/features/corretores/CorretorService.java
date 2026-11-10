package com.hcr.corretora.features.corretores;

import com.hcr.corretora.features.corretores.dto.CorretorRequest;
import com.hcr.corretora.features.corretores.dto.CorretorResponse;
import com.hcr.corretora.features.usuarios.Usuario;
import com.hcr.corretora.features.usuarios.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CorretorService {

    private final CorretorRepository corretorRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public CorretorService(
            CorretorRepository corretorRepository,
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.corretorRepository = corretorRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<CorretorResponse> listarTodos() {
        return corretorRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public CorretorResponse buscarPorId(Long id) {
        Corretor corretor = buscarEntidadePorId(id);
        return toResponse(corretor);
    }

    public Corretor buscarEntidadePorId(Long id) {
        return corretorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Corretor não encontrado com id: " + id));
    }

    @Transactional
    public CorretorResponse criar(CorretorRequest request) {
        if (corretorRepository.existsByDadosProfissionais(request.dadosProfissionais())) {
            throw new IllegalArgumentException("Já existe um corretor com o registro: " + request.dadosProfissionais());
        }

        Usuario usuario = null;
        if (request.email() != null && !request.email().isBlank()) {
            String email = request.email().trim().toLowerCase();
            if (usuarioRepository.existsByLoginEmail(email)) {
                usuario = usuarioRepository.findByLoginEmail(email).orElse(null);
            } else {
                String senha = (request.senha() != null && !request.senha().isBlank()) ? request.senha() : "corretor123";
                usuario = new Usuario(null, email, passwordEncoder.encode(senha), "CORRETOR", "ATIVO");
                usuario = usuarioRepository.save(usuario);
            }
        }

        Corretor corretor = new Corretor(
                null,
                request.nome().trim(),
                request.dadosProfissionais().trim(),
                request.status() != null ? request.status() : "ATIVO",
                usuario
        );

        Corretor salvo = corretorRepository.save(corretor);
        return toResponse(salvo);
    }

    @Transactional
    public CorretorResponse atualizar(Long id, CorretorRequest request) {
        Corretor corretor = buscarEntidadePorId(id);

        if (!corretor.getDadosProfissionais().equals(request.dadosProfissionais())
                && corretorRepository.existsByDadosProfissionais(request.dadosProfissionais())) {
            throw new IllegalArgumentException("Já existe outro corretor com o registro: " + request.dadosProfissionais());
        }

        corretor.setNome(request.nome().trim());
        corretor.setDadosProfissionais(request.dadosProfissionais().trim());
        if (request.status() != null) {
            corretor.setStatus(request.status());
        }

        if (request.email() != null && !request.email().isBlank()) {
            String email = request.email().trim().toLowerCase();
            if (corretor.getUsuario() != null) {
                corretor.getUsuario().setLoginEmail(email);
                if (request.senha() != null && !request.senha().isBlank()) {
                    corretor.getUsuario().setSenha(passwordEncoder.encode(request.senha()));
                }
                usuarioRepository.save(corretor.getUsuario());
            } else {
                String senha = (request.senha() != null && !request.senha().isBlank()) ? request.senha() : "corretor123";
                Usuario novo = new Usuario(null, email, passwordEncoder.encode(senha), "CORRETOR", "ATIVO");
                novo = usuarioRepository.save(novo);
                corretor.setUsuario(novo);
            }
        }

        return toResponse(corretorRepository.save(corretor));
    }

    @Transactional
    public CorretorResponse alternarStatus(Long id, String status) {
        Corretor corretor = buscarEntidadePorId(id);
        corretor.setStatus(status.toUpperCase());
        if (corretor.getUsuario() != null) {
            corretor.getUsuario().setStatus(status.toUpperCase());
            usuarioRepository.save(corretor.getUsuario());
        }
        return toResponse(corretorRepository.save(corretor));
    }

    public CorretorResponse toResponse(Corretor corretor) {
        return new CorretorResponse(
                corretor.getId(),
                corretor.getNome(),
                corretor.getDadosProfissionais(),
                corretor.getStatus(),
                corretor.getUsuario() != null ? corretor.getUsuario().getId() : null,
                corretor.getUsuario() != null ? corretor.getUsuario().getLoginEmail() : null
        );
    }
}
