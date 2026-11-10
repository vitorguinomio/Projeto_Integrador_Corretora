package com.hcr.corretora.features.seguros;

import com.hcr.corretora.features.seguros.dto.CoberturaDto;
import com.hcr.corretora.features.seguros.dto.SeguroRequest;
import com.hcr.corretora.features.seguros.dto.SeguroResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class SeguroService {

    private final SeguroRepository seguroRepository;
    private final CoberturaRepository coberturaRepository;

    public SeguroService(SeguroRepository seguroRepository, CoberturaRepository coberturaRepository) {
        this.seguroRepository = seguroRepository;
        this.coberturaRepository = coberturaRepository;
    }

    @Transactional(readOnly = true)
    public List<SeguroResponse> listarTodos() {
        return seguroRepository.findAllWithCoberturas().stream()
                .map(this::toResponse)
                .toList();
    }

    public SeguroResponse buscarPorId(Long id) {
        Seguro seguro = buscarEntidadePorId(id);
        return toResponse(seguro);
    }

    public Seguro buscarEntidadePorId(Long id) {
        return seguroRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Seguro não encontrado com id: " + id));
    }

    @Transactional
    public SeguroResponse criar(SeguroRequest request) {
        if (seguroRepository.existsByNome(request.nome())) {
            throw new IllegalArgumentException("Já existe um tipo de seguro com o nome: " + request.nome());
        }

        Seguro seguro = new Seguro(
                null,
                request.nome().trim(),
                request.descricao().trim(),
                request.caracteristicas(),
                request.valorBase() != null ? request.valorBase() : BigDecimal.ZERO
        );

        if (request.coberturas() != null) {
            for (CoberturaDto c : request.coberturas()) {
                Cobertura cob = new Cobertura(null, c.descricao(), c.valor(), seguro);
                seguro.addCobertura(cob);
            }
        }

        Seguro salvo = seguroRepository.save(seguro);
        return toResponse(salvo);
    }

    @Transactional
    public SeguroResponse atualizar(Long id, SeguroRequest request) {
        Seguro seguro = buscarEntidadePorId(id);

        if (!seguro.getNome().equalsIgnoreCase(request.nome()) && seguroRepository.existsByNome(request.nome())) {
            throw new IllegalArgumentException("Já existe outro seguro com o nome: " + request.nome());
        }

        seguro.setNome(request.nome().trim());
        seguro.setDescricao(request.descricao().trim());
        seguro.setCaracteristicas(request.caracteristicas());
        if (request.valorBase() != null) {
            seguro.setValorBase(request.valorBase());
        }

        seguro.getCoberturas().clear();
        if (request.coberturas() != null) {
            for (CoberturaDto c : request.coberturas()) {
                Cobertura cob = new Cobertura(null, c.descricao(), c.valor(), seguro);
                seguro.addCobertura(cob);
            }
        }

        return toResponse(seguroRepository.save(seguro));
    }

    @Transactional
    public CoberturaDto adicionarCobertura(Long seguroId, CoberturaDto dto) {
        Seguro seguro = buscarEntidadePorId(seguroId);
        Cobertura cobertura = new Cobertura(null, dto.descricao(), dto.valor(), seguro);
        Cobertura salva = coberturaRepository.save(cobertura);
        return new CoberturaDto(salva.getId(), salva.getDescricao(), salva.getValor());
    }

    @Transactional
    public void removerCobertura(Long coberturaId) {
        coberturaRepository.deleteById(coberturaId);
    }

    public SeguroResponse toResponse(Seguro seguro) {
        List<CoberturaDto> coberturasDto = seguro.getCoberturas() != null ? seguro.getCoberturas().stream()
                .map(c -> new CoberturaDto(c.getId(), c.getDescricao(), c.getValor()))
                .toList() : new ArrayList<>();

        return new SeguroResponse(
                seguro.getId(),
                seguro.getNome(),
                seguro.getDescricao(),
                seguro.getCaracteristicas(),
                seguro.getValorBase(),
                coberturasDto
        );
    }
}
