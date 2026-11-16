package com.hcr.corretora.features.propostas;

import com.hcr.corretora.features.apolices.ApoliceService;
import com.hcr.corretora.features.apolices.dto.ApoliceRequest;
import com.hcr.corretora.features.auditoria.AuditoriaService;
import com.hcr.corretora.features.corretores.Corretor;
import com.hcr.corretora.features.corretores.CorretorRepository;
import com.hcr.corretora.features.cotacoes.Cotacao;
import com.hcr.corretora.features.cotacoes.CotacaoRepository;
import com.hcr.corretora.features.propostas.dto.PropostaRequest;
import com.hcr.corretora.features.propostas.dto.PropostaResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class PropostaService {

    private final PropostaRepository propostaRepository;
    private final CotacaoRepository cotacaoRepository;
    private final CorretorRepository corretorRepository;
    private final ApoliceService apoliceService;
    private final AuditoriaService auditoriaService;

    public PropostaService(
            PropostaRepository propostaRepository,
            CotacaoRepository cotacaoRepository,
            CorretorRepository corretorRepository,
            ApoliceService apoliceService,
            AuditoriaService auditoriaService
    ) {
        this.propostaRepository = propostaRepository;
        this.cotacaoRepository = cotacaoRepository;
        this.corretorRepository = corretorRepository;
        this.apoliceService = apoliceService;
        this.auditoriaService = auditoriaService;
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

        if (request.premio() != null) {
            cotacao.setValor(request.premio());
        }

        Proposta proposta = new Proposta(
                null,
                request.condicoes().trim(),
                request.situacao() != null ? request.situacao() : "PENDENTE",
                cotacao
        );

        cotacao.setSituacao("PROPOSTA_GERADA");
        cotacaoRepository.save(cotacao);

        Proposta salva = propostaRepository.save(proposta);
        auditoriaService.registrarOperacao(
                "CRIACAO",
                "proposta",
                "Elaboração da proposta #" + salva.getId() + " vinculada à cotação #" + cotacao.getId()
        );
        return toResponse(salva);
    }

    @Transactional
    public PropostaResponse aceitar(Long id) {
        Proposta proposta = buscarEntidadePorId(id);
        proposta.setSituacao("ACEITA");
        Cotacao cotacao = proposta.getCotacao();
        cotacao.setSituacao("APROVADA");
        cotacaoRepository.save(cotacao);

        Proposta salva = propostaRepository.save(proposta);
        auditoriaService.registrarOperacao(
                "ATUALIZAR",
                "proposta",
                "Aceite da proposta #" + salva.getId() + " pelo cliente e geração automática de apólice"
        );

        // Gera apólice automaticamente ao aceitar proposta
        if (cotacao.getCliente() != null && cotacao.getSeguro() != null) {
            Long corretorId = cotacao.getCorretor() != null ? cotacao.getCorretor().getId() : null;
            if (corretorId == null) {
                List<Corretor> corretores = corretorRepository.findAll();
                if (!corretores.isEmpty()) {
                    corretorId = corretores.get(0).getId();
                }
            }
            if (corretorId != null) {
                BigDecimal premio = cotacao.getValor() != null ? cotacao.getValor() : cotacao.getSeguro().getValorBase();
                apoliceService.criar(new ApoliceRequest(
                        null,
                        cotacao.getCliente().getId(),
                        corretorId,
                        cotacao.getSeguro().getId(),
                        LocalDate.now(),
                        LocalDate.now().plusYears(1),
                        premio,
                        premio,
                        "ATIVA",
                        12
                ));
            }
        }

        return toResponse(salva);
    }

    @Transactional
    public PropostaResponse recusar(Long id) {
        Proposta proposta = buscarEntidadePorId(id);
        proposta.setSituacao("RECUSADA");
        proposta.getCotacao().setSituacao("RECUSADA");
        cotacaoRepository.save(proposta.getCotacao());

        Proposta salva = propostaRepository.save(proposta);
        auditoriaService.registrarOperacao("ATUALIZAR", "proposta", "Recusa da proposta #" + salva.getId());
        return toResponse(salva);
    }

    public PropostaResponse toResponse(Proposta p) {
        Cotacao c = p.getCotacao();
        return new PropostaResponse(
                p.getId(),
                p.getCondicoes(),
                p.getSituacao(),
                c != null ? c.getId() : null,
                c != null ? c.getValor() : null,
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
