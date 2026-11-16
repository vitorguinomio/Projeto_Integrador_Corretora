package com.hcr.corretora.features.corretores;

import com.hcr.corretora.features.apolices.Apolice;
import com.hcr.corretora.features.apolices.ApoliceRepository;
import com.hcr.corretora.features.auditoria.AuditoriaService;
import com.hcr.corretora.features.corretores.dto.CorretorRequest;
import com.hcr.corretora.features.corretores.dto.CorretorResponse;
import com.hcr.corretora.features.usuarios.Usuario;
import com.hcr.corretora.features.usuarios.UsuarioRepository;
import com.hcr.corretora.features.usuarios.UsuarioService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CorretorService {

    private final CorretorRepository corretorRepository;
    private final UsuarioRepository usuarioRepository;
    private final ApoliceRepository apoliceRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;

    public CorretorService(
            CorretorRepository corretorRepository,
            UsuarioRepository usuarioRepository,
            ApoliceRepository apoliceRepository,
            PasswordEncoder passwordEncoder,
            AuditoriaService auditoriaService
    ) {
        this.corretorRepository = corretorRepository;
        this.usuarioRepository = usuarioRepository;
        this.apoliceRepository = apoliceRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditoriaService = auditoriaService;
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
        String susep = request.dadosProfissionais() != null && !request.dadosProfissionais().isBlank()
                ? request.dadosProfissionais().trim()
                : (request.registroSusep() != null ? request.registroSusep().trim() : "");

        if (susep.isBlank()) {
            throw new IllegalArgumentException("O registro SUSEP / dados profissionais é obrigatório.");
        }

        if (corretorRepository.existsByDadosProfissionais(susep)) {
            throw new IllegalArgumentException("Já existe um corretor cadastrado com o registro SUSEP: " + susep);
        }

        UsuarioService.validarFormatoEmail(request.email());
        String email = request.email().trim().toLowerCase();

        Usuario usuario;
        if (usuarioRepository.existsByLoginEmail(email)) {
            usuario = usuarioRepository.findByLoginEmail(email).orElse(null);
        } else {
            String senha = (request.senha() != null && !request.senha().isBlank()) ? request.senha() : "corretor123";
            usuario = new Usuario(null, request.nome().trim(), email, passwordEncoder.encode(senha), "CORRETOR", "ATIVO");
            usuario = usuarioRepository.save(usuario);
        }

        String statusNorm = request.status() != null && !request.status().isBlank()
                ? request.status().trim().toUpperCase()
                : "ATIVO";

        Corretor corretor = new Corretor(
                null,
                request.nome().trim(),
                susep,
                request.especialidade(),
                request.telefone(),
                statusNorm,
                usuario
        );

        Corretor salvo = corretorRepository.save(corretor);
        auditoriaService.registrarOperacao(
                "CRIACAO",
                "corretor",
                "Cadastro do corretor " + salvo.getNome() + " (SUSEP: " + salvo.getDadosProfissionais() + ")"
        );
        return toResponse(salvo);
    }

    @Transactional
    public CorretorResponse atualizar(Long id, CorretorRequest request) {
        Corretor corretor = buscarEntidadePorId(id);

        String susep = request.dadosProfissionais() != null && !request.dadosProfissionais().isBlank()
                ? request.dadosProfissionais().trim()
                : (request.registroSusep() != null ? request.registroSusep().trim() : corretor.getDadosProfissionais());

        if (!corretor.getDadosProfissionais().equals(susep)
                && corretorRepository.existsByDadosProfissionais(susep)) {
            throw new IllegalArgumentException("Já existe outro corretor com o registro: " + susep);
        }

        corretor.setNome(request.nome().trim());
        corretor.setDadosProfissionais(susep);
        if (request.especialidade() != null && !request.especialidade().isBlank()) {
            corretor.setEspecialidade(request.especialidade().trim());
        }
        if (request.telefone() != null) {
            corretor.setTelefone(request.telefone().trim());
        }
        if (request.status() != null && !request.status().isBlank()) {
            corretor.setStatus(request.status().trim().toUpperCase());
        }

        if (request.email() != null && !request.email().isBlank()) {
            UsuarioService.validarFormatoEmail(request.email());
            String email = request.email().trim().toLowerCase();
            if (corretor.getUsuario() != null) {
                corretor.getUsuario().setLoginEmail(email);
                corretor.getUsuario().setNome(corretor.getNome());
                if (request.senha() != null && !request.senha().isBlank()) {
                    corretor.getUsuario().setSenha(passwordEncoder.encode(request.senha()));
                }
                usuarioRepository.save(corretor.getUsuario());
            } else {
                String senha = (request.senha() != null && !request.senha().isBlank()) ? request.senha() : "corretor123";
                Usuario novo = new Usuario(null, corretor.getNome(), email, passwordEncoder.encode(senha), "CORRETOR", "ATIVO");
                novo = usuarioRepository.save(novo);
                corretor.setUsuario(novo);
            }
        }

        Corretor salvo = corretorRepository.save(corretor);
        auditoriaService.registrarOperacao("ATUALIZAR", "corretor", "Atualização cadastral do corretor " + salvo.getNome());
        return toResponse(salvo);
    }

    @Transactional
    public CorretorResponse alternarStatus(Long id, String status) {
        Corretor corretor = buscarEntidadePorId(id);
        corretor.setStatus(status.toUpperCase());
        if (corretor.getUsuario() != null) {
            corretor.getUsuario().setStatus(status.toUpperCase());
            usuarioRepository.save(corretor.getUsuario());
        }
        Corretor salvo = corretorRepository.save(corretor);
        auditoriaService.registrarOperacao(
                "ATUALIZAR",
                "corretor",
                "Alteração de status do corretor " + salvo.getNome() + " para " + salvo.getStatus()
        );
        return toResponse(salvo);
    }

    public CorretorResponse toResponse(Corretor corretor) {
        List<Apolice> apolicesCorretor = apoliceRepository.findByCorretorId(corretor.getId());
        long totalApolices = apolicesCorretor.stream()
                .filter(a -> "ATIVA".equalsIgnoreCase(a.getSituacao()) || "EM_RENOVACAO".equalsIgnoreCase(a.getSituacao()))
                .count();
        long totalClientes = apolicesCorretor.stream()
                .filter(a -> a.getCliente() != null)
                .map(a -> a.getCliente().getId())
                .distinct()
                .count();

        return new CorretorResponse(
                corretor.getId(),
                corretor.getNome(),
                corretor.getDadosProfissionais(),
                corretor.getDadosProfissionais(),
                corretor.getEspecialidade() != null ? corretor.getEspecialidade() : "Geral",
                corretor.getTelefone(),
                corretor.getStatus(),
                corretor.getUsuario() != null ? corretor.getUsuario().getId() : null,
                corretor.getUsuario() != null ? corretor.getUsuario().getLoginEmail() : null,
                totalClientes,
                totalApolices
        );
    }
}
