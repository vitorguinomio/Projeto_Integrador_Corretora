package com.hcr.corretora.features.auth;

import com.hcr.corretora.core.security.JwtTokenService;
import com.hcr.corretora.features.administradores.AdministradorRepository;
import com.hcr.corretora.features.auth.dto.LoginRequest;
import com.hcr.corretora.features.auth.dto.LoginResponse;
import com.hcr.corretora.features.auth.dto.RegisterRequest;
import com.hcr.corretora.features.clientes.Cliente;
import com.hcr.corretora.features.clientes.ClienteRepository;
import com.hcr.corretora.features.clientes.Endereco;
import com.hcr.corretora.features.clientes.Telefone;
import com.hcr.corretora.features.clientes.dto.EnderecoDto;
import com.hcr.corretora.features.clientes.dto.TelefoneDto;
import com.hcr.corretora.features.corretores.CorretorRepository;
import com.hcr.corretora.features.usuarios.Usuario;
import com.hcr.corretora.features.usuarios.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final CorretorRepository corretorRepository;
    private final AdministradorRepository administradorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            ClienteRepository clienteRepository,
            CorretorRepository corretorRepository,
            AdministradorRepository administradorRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenService jwtTokenService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.corretorRepository = corretorRepository;
        this.administradorRepository = administradorRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }

    public LoginResponse autenticar(LoginRequest loginRequest) {
        String email = loginRequest.email().trim().toLowerCase();
        Usuario usuario = usuarioRepository.findByLoginEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Credenciais inválidas: e-mail ou senha incorretos"));

        if (!passwordEncoder.matches(loginRequest.senha(), usuario.getSenha())) {
            throw new IllegalArgumentException("Credenciais inválidas: e-mail ou senha incorretos");
        }

        if (!"ATIVO".equalsIgnoreCase(usuario.getStatus())) {
            throw new IllegalArgumentException("Usuário desativado. Contate o administrador do sistema.");
        }

        String nome = obterNomePorUsuario(usuario);
        String token = jwtTokenService.generateToken(usuario.getId(), usuario.getLoginEmail(), usuario.getPerfilAcesso());

        return new LoginResponse(
                token,
                "Bearer",
                usuario.getId(),
                usuario.getLoginEmail(),
                usuario.getPerfilAcesso(),
                nome,
                usuario.getStatus()
        );
    }

    @Transactional
    public LoginResponse registrar(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (usuarioRepository.existsByLoginEmail(email)) {
            throw new IllegalArgumentException("Já existe um usuário com o e-mail: " + email);
        }

        if (clienteRepository.existsByCpfCnpj(request.cpfCnpj())) {
            throw new IllegalArgumentException("Já existe um cliente cadastrado com o CPF/CNPJ: " + request.cpfCnpj());
        }

        Usuario usuario = new Usuario(
                null,
                email,
                passwordEncoder.encode(request.senha()),
                "CLIENTE",
                "ATIVO"
        );
        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        Cliente cliente = new Cliente(
                null,
                request.nome().trim(),
                request.cpfCnpj().trim(),
                request.dataNasc(),
                email,
                usuarioSalvo
        );

        if (request.enderecos() != null) {
            for (EnderecoDto e : request.enderecos()) {
                Endereco end = new Endereco(
                        null,
                        e.cep(),
                        e.logradouro(),
                        e.numero(),
                        e.complemento(),
                        e.bairro(),
                        e.cidade(),
                        e.estado().toUpperCase(),
                        cliente
                );
                cliente.addEndereco(end);
            }
        }

        if (request.telefones() != null) {
            for (TelefoneDto t : request.telefones()) {
                Telefone tel = new Telefone(
                        null,
                        t.ddd(),
                        t.numero(),
                        t.tipo() != null ? t.tipo() : "CELULAR",
                        cliente
                );
                cliente.addTelefone(tel);
            }
        }

        clienteRepository.save(cliente);

        String token = jwtTokenService.generateToken(usuarioSalvo.getId(), usuarioSalvo.getLoginEmail(), usuarioSalvo.getPerfilAcesso());
        return new LoginResponse(
                token,
                "Bearer",
                usuarioSalvo.getId(),
                usuarioSalvo.getLoginEmail(),
                usuarioSalvo.getPerfilAcesso(),
                cliente.getNome(),
                usuarioSalvo.getStatus()
        );
    }

    public Map<String, Object> obterUsuarioLogado(String email) {
        Usuario usuario = usuarioRepository.findByLoginEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + email));

        Map<String, Object> info = new HashMap<>();
        info.put("id", usuario.getId());
        info.put("email", usuario.getLoginEmail());
        info.put("perfilAcesso", usuario.getPerfilAcesso());
        info.put("status", usuario.getStatus());
        info.put("nome", obterNomePorUsuario(usuario));

        if ("CLIENTE".equalsIgnoreCase(usuario.getPerfilAcesso())) {
            clienteRepository.findByUsuarioId(usuario.getId()).ifPresent(c -> info.put("clienteId", c.getId()));
        } else if ("CORRETOR".equalsIgnoreCase(usuario.getPerfilAcesso())) {
            corretorRepository.findByUsuarioId(usuario.getId()).ifPresent(c -> info.put("corretorId", c.getId()));
        } else if ("ADMINISTRADOR".equalsIgnoreCase(usuario.getPerfilAcesso())) {
            administradorRepository.findByUsuarioId(usuario.getId()).ifPresent(a -> info.put("administradorId", a.getId()));
        }

        return info;
    }

    private String obterNomePorUsuario(Usuario usuario) {
        if ("ADMINISTRADOR".equalsIgnoreCase(usuario.getPerfilAcesso())) {
            return administradorRepository.findByUsuarioId(usuario.getId())
                    .map(a -> a.getNome())
                    .orElse("Administrador");
        } else if ("CORRETOR".equalsIgnoreCase(usuario.getPerfilAcesso())) {
            return corretorRepository.findByUsuarioId(usuario.getId())
                    .map(c -> c.getNome())
                    .orElse("Corretor");
        } else if ("CLIENTE".equalsIgnoreCase(usuario.getPerfilAcesso())) {
            return clienteRepository.findByUsuarioId(usuario.getId())
                    .map(c -> c.getNome())
                    .orElse("Cliente");
        }
        return "Usuário HCR";
    }
}
