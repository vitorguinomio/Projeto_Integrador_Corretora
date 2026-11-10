package com.hcr.corretora.features.clientes;

import com.hcr.corretora.features.clientes.dto.ClienteRequest;
import com.hcr.corretora.features.clientes.dto.ClienteResponse;
import com.hcr.corretora.features.clientes.dto.EnderecoDto;
import com.hcr.corretora.features.clientes.dto.TelefoneDto;
import com.hcr.corretora.features.usuarios.Usuario;
import com.hcr.corretora.features.usuarios.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public ClienteService(
            ClienteRepository clienteRepository,
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<ClienteResponse> listarTodos() {
        return clienteRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public ClienteResponse buscarPorId(Long id) {
        Cliente cliente = buscarEntidadePorId(id);
        return toResponse(cliente);
    }

    public Cliente buscarEntidadePorId(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado com id: " + id));
    }

    public List<ClienteResponse> buscar(String termo) {
        if (termo == null || termo.isBlank()) {
            return listarTodos();
        }
        return clienteRepository.buscarPorTermo(termo.trim()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ClienteResponse criar(ClienteRequest request) {
        String cpfLimpo = request.cpfCnpj().replaceAll("[^0-9]", "");
        if (clienteRepository.existsByCpfCnpj(request.cpfCnpj()) || clienteRepository.existsByCpfCnpj(cpfLimpo)) {
            throw new IllegalArgumentException("Já existe um cliente cadastrado com o CPF/CNPJ: " + request.cpfCnpj());
        }

        Usuario usuario = null;
        if (request.senhaAcesso() != null && !request.senhaAcesso().isBlank()) {
            String email = request.email().trim().toLowerCase();
            if (usuarioRepository.existsByLoginEmail(email)) {
                usuario = usuarioRepository.findByLoginEmail(email).orElse(null);
            } else {
                usuario = new Usuario(null, email, passwordEncoder.encode(request.senhaAcesso()), "CLIENTE", "ATIVO");
                usuario = usuarioRepository.save(usuario);
            }
        }

        Cliente cliente = new Cliente(
                null,
                request.nome().trim(),
                request.cpfCnpj().trim(),
                request.dataNasc(),
                request.email().trim().toLowerCase(),
                usuario
        );

        if (request.enderecos() != null) {
            for (EnderecoDto e : request.enderecos()) {
                Endereco endereco = new Endereco(
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
                cliente.addEndereco(endereco);
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

        Cliente salvo = clienteRepository.save(cliente);
        return toResponse(salvo);
    }

    @Transactional
    public ClienteResponse atualizar(Long id, ClienteRequest request) {
        Cliente cliente = buscarEntidadePorId(id);

        if (!cliente.getCpfCnpj().equals(request.cpfCnpj()) && clienteRepository.existsByCpfCnpj(request.cpfCnpj())) {
            throw new IllegalArgumentException("Já existe outro cliente cadastrado com o CPF/CNPJ: " + request.cpfCnpj());
        }

        cliente.setNome(request.nome().trim());
        cliente.setCpfCnpj(request.cpfCnpj().trim());
        cliente.setDataNasc(request.dataNasc());
        cliente.setEmail(request.email().trim().toLowerCase());

        // Atualizar senhas se fornecido
        if (request.senhaAcesso() != null && !request.senhaAcesso().isBlank()) {
            if (cliente.getUsuario() != null) {
                cliente.getUsuario().setSenha(passwordEncoder.encode(request.senhaAcesso()));
                usuarioRepository.save(cliente.getUsuario());
            } else {
                Usuario novoUsuario = new Usuario(
                        null,
                        cliente.getEmail(),
                        passwordEncoder.encode(request.senhaAcesso()),
                        "CLIENTE",
                        "ATIVO"
                );
                novoUsuario = usuarioRepository.save(novoUsuario);
                cliente.setUsuario(novoUsuario);
            }
        }

        // Atualizar endereços
        cliente.getEnderecos().clear();
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

        // Atualizar telefones
        cliente.getTelefones().clear();
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

        return toResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public void excluir(Long id) {
        Cliente cliente = buscarEntidadePorId(id);
        clienteRepository.delete(cliente);
    }

    public ClienteResponse toResponse(Cliente cliente) {
        List<EnderecoDto> enderecosDto = cliente.getEnderecos() != null ? cliente.getEnderecos().stream()
                .map(e -> new EnderecoDto(
                        e.getId(),
                        e.getCep(),
                        e.getLogradouro(),
                        e.getNumero(),
                        e.getComplemento(),
                        e.getBairro(),
                        e.getCidade(),
                        e.getEstado()
                ))
                .toList() : new ArrayList<>();

        List<TelefoneDto> telefonesDto = cliente.getTelefones() != null ? cliente.getTelefones().stream()
                .map(t -> new TelefoneDto(
                        t.getId(),
                        t.getDdd(),
                        t.getNumero(),
                        t.getTipo()
                ))
                .toList() : new ArrayList<>();

        return new ClienteResponse(
                cliente.getId(),
                cliente.getNome(),
                cliente.getCpfCnpj(),
                cliente.getDataNasc(),
                cliente.getEmail(),
                cliente.getUsuario() != null ? cliente.getUsuario().getId() : null,
                enderecosDto,
                telefonesDto
        );
    }
}
