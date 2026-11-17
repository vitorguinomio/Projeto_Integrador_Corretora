package com.hcr.corretora.features.corretores;

import com.hcr.corretora.features.apolices.ApoliceRepository;
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
    private final ApoliceRepository apoliceRepository;

    public CorretorService(
            CorretorRepository corretorRepository,
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            ApoliceRepository apoliceRepository
    ) {
        this.corretorRepository = corretorRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.apoliceRepository = apoliceRepository;
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
                normalizarStatus(request.status()),
                usuario
        );
        corretor.setEspecialidade(textoOuNulo(request.especialidade()));
        corretor.setTelefone(textoOuNulo(request.telefone()));

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
        corretor.setEspecialidade(textoOuNulo(request.especialidade()));
        corretor.setTelefone(textoOuNulo(request.telefone()));
        if (request.status() != null && !request.status().isBlank()) {
            corretor.setStatus(normalizarStatus(request.status()));
            // Corretor inativo não acessa o sistema; ativo ou de férias mantém o login
            if (corretor.getUsuario() != null) {
                corretor.getUsuario().setStatus("INATIVO".equals(corretor.getStatus()) ? "INATIVO" : "ATIVO");
            }
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
        corretor.setStatus(normalizarStatus(status));
        if (corretor.getUsuario() != null) {
            corretor.getUsuario().setStatus(normalizarStatus(status));
            usuarioRepository.save(corretor.getUsuario());
        }
        return toResponse(corretorRepository.save(corretor));
    }

    @Transactional
    public void excluir(Long id) {
        Corretor corretor = buscarEntidadePorId(id);

        if (!apoliceRepository.findByCorretorId(id).isEmpty()) {
            throw new IllegalArgumentException(
                    "Não é possível excluir o corretor pois ele possui apólices vinculadas. Altere o status para INATIVO.");
        }

        Usuario usuario = corretor.getUsuario();
        corretorRepository.delete(corretor);
        corretorRepository.flush();

        // Remove o login do corretor para que ele não consiga mais acessar o sistema
        if (usuario != null && "CORRETOR".equalsIgnoreCase(usuario.getPerfilAcesso())) {
            usuarioRepository.delete(usuario);
        }
    }

    private String normalizarStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ATIVO";
        }
        String s = status.trim().toUpperCase();
        return s.equals("FÉRIAS") ? "FERIAS" : s;
    }

    private String textoOuNulo(String valor) {
        return (valor == null || valor.isBlank()) ? null : valor.trim();
    }

    public CorretorResponse toResponse(Corretor corretor) {
        return new CorretorResponse(
                corretor.getId(),
                corretor.getNome(),
                corretor.getDadosProfissionais(),
                corretor.getEspecialidade(),
                corretor.getTelefone(),
                corretor.getStatus(),
                corretor.getUsuario() != null ? corretor.getUsuario().getId() : null,
                corretor.getUsuario() != null ? corretor.getUsuario().getLoginEmail() : null
        );
    }
}
