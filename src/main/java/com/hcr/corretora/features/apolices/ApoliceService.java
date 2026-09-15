package com.hcr.corretora.features.apolices;

import com.hcr.corretora.features.apolices.dto.ApoliceRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ApoliceService {

    private final ApoliceRepository apoliceRepository;

    public ApoliceService(ApoliceRepository apoliceRepository) {
        this.apoliceRepository = apoliceRepository;
    }

    public List<Apolice> listarTodas() {
        return apoliceRepository.findAll();
    }

    public Apolice criar(ApoliceRequest request) {
        Apolice apolice = new Apolice(
                null,
                request.numeroApolice(),
                request.clienteId(),
                request.seguroId(),
                request.dataInicio(),
                request.dataFim(),
                request.valorPremio(),
                request.status()
        );
        return apoliceRepository.save(apolice);
    }
}
