package com.hcr.corretora.features.usuarios;

import com.hcr.corretora.features.administradores.Administrador;
import com.hcr.corretora.features.administradores.AdministradorRepository;
import com.hcr.corretora.features.auditoria.AuditoriaService;
import com.hcr.corretora.features.clientes.Cliente;
import com.hcr.corretora.features.clientes.ClienteRepository;
import com.hcr.corretora.features.clientes.Endereco;
import com.hcr.corretora.features.clientes.Telefone;
import com.hcr.corretora.features.corretores.Corretor;
import com.hcr.corretora.features.corretores.CorretorRepository;
import com.hcr.corretora.features.usuarios.dto.UsuarioCreateRequest;
import com.hcr.corretora.features.usuarios.dto.UsuarioResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@Transactional(readOnly = true)
public class UsuarioService {

    private static final Pattern EMAIL_VALIDO_PATTERN = Pattern.compile(
            "^[^\\s@]+@[a-zA-Z0-9.-]+\\.(com\\.br|com|org\\.br|net\\.br|gov\\.br|edu\\.br|br)$",
            Pattern.CASE_INSENSITIVE
    );

    private final UsuarioRepository usuarioRepository;
    private final AdministradorRepository administradorRepository;
    private final CorretorRepository corretorRepository;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            AdministradorRepository administradorRepository,
            CorretorRepository corretorRepository,
            ClienteRepository clienteRepository,
            PasswordEncoder passwordEncoder,
            AuditoriaService auditoriaService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.administradorRepository = administradorRepository;
        this.corretorRepository = corretorRepository;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditoriaService = auditoriaService;
    }

    public static void validarFormatoEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("O e-mail de acesso é obrigatório.");
        }
        String limpo = email.trim();
        if (!limpo.contains("@")) {
            throw new IllegalArgumentException("E-mail inválido: é obrigatório conter '@' (ex: nome@empresa.com.br).");
        }
        if (!EMAIL_VALIDO_PATTERN.matcher(limpo).matches()) {
            throw new IllegalArgumentException("E-mail inválido: informe um domínio válido terminado em .com ou .com.br (ex: usuario@gmail.com, corretor@hotmail.com, nome@empresa.com.br).");
        }
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
        String rawEmail = request.loginEmail() != null && !request.loginEmail().isBlank()
                ? request.loginEmail()
                : request.email();

        validarFormatoEmail(rawEmail);
        String email = rawEmail.trim().toLowerCase();

        if (usuarioRepository.existsByLoginEmail(email)) {
            throw new IllegalArgumentException("Já existe um usuário cadastrado com o e-mail informado: " + email);
        }

        String rawPerfil = request.perfilAcesso() != null && !request.perfilAcesso().isBlank()
                ? request.perfilAcesso()
                : (request.perfil() != null && !request.perfil().isBlank() ? request.perfil() : "CORRETOR");

        String nome = (request.nome() != null && !request.nome().isBlank())
                ? request.nome().trim()
                : formatarNomeDeEmail(email);

        String statusInicial = request.status() != null ? request.status().toUpperCase() : "ATIVO";

        Usuario usuario = new Usuario(
                null,
                nome,
                email,
                passwordEncoder.encode(request.senha()),
                rawPerfil.toUpperCase(),
                statusInicial
        );

        Usuario salvo = usuarioRepository.save(usuario);

        // Registra automaticamente na tabela de ator correspondente (administrador, corretor ou cliente)
        if ("ADMINISTRADOR".equalsIgnoreCase(salvo.getPerfilAcesso())
                && administradorRepository.findByUsuarioId(salvo.getId()).isEmpty()) {
            administradorRepository.save(new Administrador(null, nome, "Administrador", salvo));
        } else if ("CORRETOR".equalsIgnoreCase(salvo.getPerfilAcesso())
                && corretorRepository.findByUsuarioId(salvo.getId()).isEmpty()) {
            String susepAuto = "SUSEP-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase() + "-DF";
            corretorRepository.save(new Corretor(null, nome, susepAuto, "Geral", "(61) 99000-0000", statusInicial, salvo));
        } else if ("CLIENTE".equalsIgnoreCase(salvo.getPerfilAcesso())
                && clienteRepository.findByUsuarioId(salvo.getId()).isEmpty()) {
            String cpfAuto = String.format("%011d", System.currentTimeMillis() % 100000000000L);
            Cliente cli = new Cliente(null, nome, cpfAuto, LocalDate.of(1990, 1, 1), email, salvo);
            cli.addEndereco(new Endereco(null, "70000-000", "Plano Piloto", "S/N", null, "Asa Sul", "Brasília", "DF", cli));
            cli.addTelefone(new Telefone(null, "61", "99000-0000", "CELULAR", cli));
            clienteRepository.save(cli);
        }

        auditoriaService.registrarOperacao(
                "CRIACAO",
                "usuario",
                "Cadastro do usuário " + salvo.getLoginEmail() + " com perfil " + salvo.getPerfilAcesso()
        );

        return toResponse(salvo);
    }

    @Transactional
    public UsuarioResponse alterarStatus(Long id, String novoStatus) {
        Usuario usuario = buscarEntidadePorId(id);
        String st = (novoStatus != null && !novoStatus.isBlank()) ? novoStatus.trim().toUpperCase() : "ATIVO";
        if (!"ATIVO".equals(st) && !"INATIVO".equals(st)) {
            st = ("TRUE".equals(st) || "1".equals(st)) ? "ATIVO" : "INATIVO";
        }
        usuario.setStatus(st);
        Usuario salvo = usuarioRepository.save(usuario);

        final String finalStatus = st;
        corretorRepository.findByUsuarioId(salvo.getId()).ifPresent(c -> {
            c.setStatus(finalStatus);
            corretorRepository.save(c);
        });

        auditoriaService.registrarOperacao(
                "ATUALIZAR",
                "usuario",
                "Alteração de status do usuário " + salvo.getLoginEmail() + " para " + finalStatus
        );

        return toResponse(salvo);
    }

    @Transactional
    public UsuarioResponse alterarPerfil(Long id, String novoPerfil) {
        Usuario usuario = buscarEntidadePorId(id);
        usuario.setPerfilAcesso(novoPerfil.toUpperCase());
        Usuario salvo = usuarioRepository.save(usuario);
        auditoriaService.registrarOperacao(
                "ATUALIZAR",
                "usuario",
                "Alteração de perfil do usuário " + salvo.getLoginEmail() + " para " + salvo.getPerfilAcesso()
        );
        return toResponse(salvo);
    }

    public UsuarioResponse toResponse(Usuario usuario) {
        String nome = resolverNome(usuario);
        String st = usuario.getStatus() != null ? usuario.getStatus().toUpperCase() : "ATIVO";
        boolean ativo = "ATIVO".equalsIgnoreCase(st);
        return new UsuarioResponse(
                usuario.getId(),
                nome,
                usuario.getLoginEmail(),
                usuario.getLoginEmail(),
                usuario.getPerfilAcesso(),
                usuario.getPerfilAcesso(),
                st,
                ativo
        );
    }

    private String resolverNome(Usuario usuario) {
        if (usuario.getNome() != null && !usuario.getNome().isBlank()) {
            return usuario.getNome();
        }
        if ("ADMINISTRADOR".equalsIgnoreCase(usuario.getPerfilAcesso())) {
            var adm = administradorRepository.findByUsuarioId(usuario.getId());
            if (adm.isPresent()) return adm.get().getNome();
        } else if ("CORRETOR".equalsIgnoreCase(usuario.getPerfilAcesso())) {
            var cor = corretorRepository.findByUsuarioId(usuario.getId());
            if (cor.isPresent()) return cor.get().getNome();
        } else if ("CLIENTE".equalsIgnoreCase(usuario.getPerfilAcesso())) {
            var cli = clienteRepository.findByUsuarioId(usuario.getId());
            if (cli.isPresent()) return cli.get().getNome();
        }
        return formatarNomeDeEmail(usuario.getLoginEmail());
    }

    private String formatarNomeDeEmail(String email) {
        if (email == null || !email.contains("@")) return "Usuário HCR";
        String local = email.substring(0, email.indexOf('@')).replace('.', ' ').replace('_', ' ').replace('-', ' ');
        String[] parts = local.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (!p.isBlank()) {
                if (!sb.isEmpty()) sb.append(" ");
                sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1).toLowerCase());
            }
        }
        return sb.isEmpty() ? "Usuário HCR" : sb.toString();
    }
}
