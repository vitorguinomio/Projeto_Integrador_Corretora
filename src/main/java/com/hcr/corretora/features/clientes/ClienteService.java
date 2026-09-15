package com.hcr.corretora.features.clientes;

import com.hcr.corretora.features.clientes.dto.ClienteRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    public Cliente criar(ClienteRequest request) {
        Cliente cliente = new Cliente(
                null,
                request.nome(),
                request.cpfCnpj(),
                request.email(),
                request.telefone(),
                request.endereco()
        );
        return clienteRepository.save(cliente);
    }
}
