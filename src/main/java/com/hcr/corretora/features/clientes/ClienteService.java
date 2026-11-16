package com.hcr.corretora.features.clientes;

import com.hcr.corretora.features.apolices.Apolice;
import com.hcr.corretora.features.apolices.ApoliceRepository;
import com.hcr.corretora.features.apolices.ApoliceService;
import com.hcr.corretora.features.apolices.dto.ApoliceResponse;
import com.hcr.corretora.features.clientes.dto.ClienteHistoricoResponse;
import com.hcr.corretora.features.clientes.dto.ClienteRequest;
import com.hcr.corretora.features.clientes.dto.ClienteResponse;
import com.hcr.corretora.features.clientes.dto.EnderecoDto;
import com.hcr.corretora.features.clientes.dto.TelefoneDto;
import com.hcr.corretora.features.cotacoes.CotacaoService;
import com.hcr.corretora.features.cotacoes.dto.CotacaoResponse;
import com.hcr.corretora.features.usuarios.Usuario;
import com.hcr.corretora.features.usuarios.UsuarioRepository;
import com.hcr.corretora.features.usuarios.UsuarioService;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final ApoliceRepository apoliceRepository;
    private final PasswordEncoder passwordEncoder;
    private final CotacaoService cotacaoService;
    private final ApoliceService apoliceService;

    public ClienteService(
            ClienteRepository clienteRepository,
            UsuarioRepository usuarioRepository,
            ApoliceRepository apoliceRepository,
            PasswordEncoder passwordEncoder,
            @Lazy CotacaoService cotacaoService,
            @Lazy ApoliceService apoliceService
    ) {
        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.apoliceRepository = apoliceRepository;
        this.passwordEncoder = passwordEncoder;
        this.cotacaoService = cotacaoService;
        this.apoliceService = apoliceService;
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

    public ClienteHistoricoResponse buscarHistorico(Long clienteId) {
        ClienteResponse cliente = buscarPorId(clienteId);
        List<CotacaoResponse> cotacoes = cotacaoService.listar(clienteId, null, null);
        List<ApoliceResponse> apolices = apoliceService.pesquisar(null, null, clienteId, null);
        return new ClienteHistoricoResponse(
                cliente.id(),
                cliente.nome(),
                cliente.cpfCnpj(),
                cliente.email(),
                cliente.enderecos(),
                cliente.telefones(),
                cliente,
                cotacoes,
                apolices
        );
    }

    @Transactional
    public ClienteResponse criar(ClienteRequest request) {
        UsuarioService.validarFormatoEmail(request.email());

        String cpfLimpo = request.cpfCnpj().replaceAll("[^0-9]", "");
        if (cpfLimpo.length() != 11 && cpfLimpo.length() != 14) {
            throw new IllegalArgumentException("CPF/CNPJ inválido: informe os 11 dígitos do CPF ou 14 dígitos do CNPJ.");
        }

        if (clienteRepository.existsByCpfCnpj(request.cpfCnpj()) || clienteRepository.existsByCpfCnpj(cpfLimpo)) {
            throw new IllegalArgumentException("Já existe um cliente cadastrado com o CPF/CNPJ: " + request.cpfCnpj());
        }

        Usuario usuario = null;
        if (request.senhaAcesso() != null && !request.senhaAcesso().isBlank()) {
            String email = request.email().trim().toLowerCase();
            if (usuarioRepository.existsByLoginEmail(email)) {
                usuario = usuarioRepository.findByLoginEmail(email).orElse(null);
            } else {
                usuario = new Usuario(null, request.nome().trim(), email, passwordEncoder.encode(request.senhaAcesso()), "CLIENTE", "ATIVO");
                usuario = usuarioRepository.save(usuario);
            }
        }

        Cliente cliente = new Cliente(
                null,
                request.nome().trim(),
                request.cpfCnpj().trim(),
                request.dataNasc() != null ? request.dataNasc() : LocalDate.of(1990, 1, 1),
                request.email().trim().toLowerCase(),
                usuario
        );

        if (request.enderecos() != null) {
            for (EnderecoDto e : request.enderecos()) {
                Endereco endereco = new Endereco(
                        null,
                        e.cep() != null && !e.cep().isBlank() ? e.cep() : "70000-000",
                        e.logradouro(),
                        e.numero() != null && !e.numero().isBlank() ? e.numero() : "S/N",
                        e.complemento(),
                        e.bairro() != null && !e.bairro().isBlank() ? e.bairro() : "Plano Piloto",
                        e.cidade() != null && !e.cidade().isBlank() ? e.cidade() : "Brasília",
                        e.estado() != null && !e.estado().isBlank() ? e.estado().toUpperCase() : "DF",
                        cliente
                );
                cliente.addEndereco(endereco);
            }
        }

        if (request.telefones() != null) {
            for (TelefoneDto t : request.telefones()) {
                String ddd = t.ddd();
                String num = t.numero() != null ? t.numero() : "";
                if (ddd == null || ddd.isBlank()) {
                    String clean = num.replaceAll("[^0-9]", "");
                    if (clean.length() >= 10) {
                        ddd = clean.substring(0, 2);
                        num = clean.substring(2);
                    } else {
                        ddd = "61";
                    }
                }
                Telefone tel = new Telefone(
                        null,
                        ddd,
                        num,
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
        UsuarioService.validarFormatoEmail(request.email());

        if (!cliente.getCpfCnpj().equals(request.cpfCnpj()) && clienteRepository.existsByCpfCnpj(request.cpfCnpj())) {
            throw new IllegalArgumentException("Já existe outro cliente cadastrado com o CPF/CNPJ: " + request.cpfCnpj());
        }

        cliente.setNome(request.nome().trim());
        cliente.setCpfCnpj(request.cpfCnpj().trim());
        if (request.dataNasc() != null) {
            cliente.setDataNasc(request.dataNasc());
        }
        cliente.setEmail(request.email().trim().toLowerCase());

        if (request.senhaAcesso() != null && !request.senhaAcesso().isBlank()) {
            if (cliente.getUsuario() != null) {
                cliente.getUsuario().setSenha(passwordEncoder.encode(request.senhaAcesso()));
                usuarioRepository.save(cliente.getUsuario());
            } else {
                Usuario novoUsuario = new Usuario(
                        null,
                        cliente.getNome(),
                        cliente.getEmail(),
                        passwordEncoder.encode(request.senhaAcesso()),
                        "CLIENTE",
                        "ATIVO"
                );
                novoUsuario = usuarioRepository.save(novoUsuario);
                cliente.setUsuario(novoUsuario);
            }
        }

        cliente.getEnderecos().clear();
        if (request.enderecos() != null) {
            for (EnderecoDto e : request.enderecos()) {
                Endereco end = new Endereco(
                        null,
                        e.cep() != null && !e.cep().isBlank() ? e.cep() : "70000-000",
                        e.logradouro(),
                        e.numero() != null && !e.numero().isBlank() ? e.numero() : "S/N",
                        e.complemento(),
                        e.bairro() != null && !e.bairro().isBlank() ? e.bairro() : "Plano Piloto",
                        e.cidade() != null && !e.cidade().isBlank() ? e.cidade() : "Brasília",
                        e.estado() != null && !e.estado().isBlank() ? e.estado().toUpperCase() : "DF",
                        cliente
                );
                cliente.addEndereco(end);
            }
        }

        cliente.getTelefones().clear();
        if (request.telefones() != null) {
            for (TelefoneDto t : request.telefones()) {
                String ddd = t.ddd();
                String num = t.numero() != null ? t.numero() : "";
                if (ddd == null || ddd.isBlank()) {
                    String clean = num.replaceAll("[^0-9]", "");
                    if (clean.length() >= 10) {
                        ddd = clean.substring(0, 2);
                        num = clean.substring(2);
                    } else {
                        ddd = "61";
                    }
                }
                Telefone tel = new Telefone(
                        null,
                        ddd,
                        num,
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

        List<Apolice> apolicesCliente = apoliceRepository.findByClienteId(cliente.getId());
        int totalApolices = apolicesCliente.size();
        Long corretorId = null;
        String corretorNome = null;
        if (!apolicesCliente.isEmpty() && apolicesCliente.get(0).getCorretor() != null) {
            corretorId = apolicesCliente.get(0).getCorretor().getId();
            corretorNome = apolicesCliente.get(0).getCorretor().getNome();
        }

        String digits = cliente.getCpfCnpj() != null ? cliente.getCpfCnpj().replaceAll("[^0-9]", "") : "";
        String tipo = digits.length() > 11 ? "PJ" : "PF";

        return new ClienteResponse(
                cliente.getId(),
                cliente.getNome(),
                cliente.getCpfCnpj(),
                tipo,
                cliente.getDataNasc(),
                cliente.getEmail(),
                cliente.getUsuario() != null ? cliente.getUsuario().getId() : null,
                corretorId,
                corretorNome,
                totalApolices,
                enderecosDto,
                telefonesDto
        );
    }
}
