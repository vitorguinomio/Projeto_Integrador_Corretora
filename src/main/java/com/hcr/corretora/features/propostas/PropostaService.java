package com.hcr.corretora.features.propostas;

import com.hcr.corretora.features.cotacoes.Cotacao;
import com.hcr.corretora.features.cotacoes.CotacaoRepository;
import com.hcr.corretora.features.propostas.dto.PropostaRequest;
import com.hcr.corretora.features.propostas.dto.PropostaResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PropostaService {

    private final PropostaRepository propostaRepository;
    private final CotacaoRepository cotacaoRepository;

    public PropostaService(PropostaRepository propostaRepository, CotacaoRepository cotacaoRepository) {
        this.propostaRepository = propostaRepository;
        this.cotacaoRepository = cotacaoRepository;
    }

    public List<PropostaResponse> listarTodas() {
        return propostaRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public PropostaResponse buscarPorId(Long id) {
        Proposta p = buscarEntidadePorId(id);
        return toResponse(p);
    }

    public Proposta buscarEntidadePorId(Long id) {
        return propostaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Proposta não encontrada com id: " + id));
    }

    public PropostaResponse buscarPorCotacaoId(Long cotacaoId) {
        Proposta p = propostaRepository.findByCotacaoId(cotacaoId)
                .orElseThrow(() -> new IllegalArgumentException("Proposta não encontrada para a cotação id: " + cotacaoId));
        return toResponse(p);
    }

    @Transactional
    public PropostaResponse criar(PropostaRequest request) {
        if (propostaRepository.existsByCotacaoId(request.cotacaoId())) {
            throw new IllegalArgumentException("Já existe uma proposta cadastrada para a cotação id: " + request.cotacaoId());
        }

        Cotacao cotacao = cotacaoRepository.findById(request.cotacaoId())
                .orElseThrow(() -> new IllegalArgumentException("Cotação não encontrada com id: " + request.cotacaoId()));

        Proposta proposta = new Proposta(
                null,
                request.condicoes().trim(),
                request.situacao() != null ? request.situacao() : "PENDENTE",
                cotacao
        );

        cotacao.setSituacao("PROPOSTA_GERADA");
        cotacaoRepository.save(cotacao);

        Proposta salva = propostaRepository.save(proposta);
        return toResponse(salva);
    }

    @Transactional
    public PropostaResponse aceitar(Long id) {
        Proposta proposta = buscarEntidadePorId(id);
        proposta.setSituacao("ACEITA");
        proposta.getCotacao().setSituacao("APROVADA");
        cotacaoRepository.save(proposta.getCotacao());

        return toResponse(propostaRepository.save(proposta));
    }

    @Transactional
    public PropostaResponse recusar(Long id) {
        Proposta proposta = buscarEntidadePorId(id);
        proposta.setSituacao("RECUSADA");
        proposta.getCotacao().setSituacao("RECUSADA");
        cotacaoRepository.save(proposta.getCotacao());

        return toResponse(propostaRepository.save(proposta));
    }

    public PropostaResponse toResponse(Proposta p) {
        Cotacao c = p.getCotacao();
        return new PropostaResponse(
                p.getId(),
                p.getCondicoes(),
                p.getSituacao(),
                c != null ? c.getId() : null,
                c != null ? c.getValor() : null,
                c != null ? c.getDataSolicitacao() : null,
                c != null && c.getCliente() != null ? c.getCliente().getId() : null,
                c != null && c.getCliente() != null ? c.getCliente().getNome() : null,
                c != null && c.getCorretor() != null ? c.getCorretor().getId() : null,
                c != null && c.getCorretor() != null ? c.getCorretor().getNome() : null,
                c != null && c.getSeguro() != null ? c.getSeguro().getId() : null,
                c != null && c.getSeguro() != null ? c.getSeguro().getNome() : null
        );
    }
}
