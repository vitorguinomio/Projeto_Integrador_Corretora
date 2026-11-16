package com.hcr.corretora.features.cotacoes;

import com.hcr.corretora.features.clientes.Cliente;
import com.hcr.corretora.features.clientes.ClienteRepository;
import com.hcr.corretora.features.corretores.Corretor;
import com.hcr.corretora.features.corretores.CorretorRepository;
import com.hcr.corretora.features.cotacoes.dto.CotacaoRequest;
import com.hcr.corretora.features.cotacoes.dto.CotacaoResponse;
import com.hcr.corretora.features.propostas.PropostaRepository;
import com.hcr.corretora.features.propostas.dto.PropostaResponse;
import com.hcr.corretora.features.seguros.Seguro;
import com.hcr.corretora.features.seguros.SeguroRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class CotacaoService {

    private final CotacaoRepository cotacaoRepository;
    private final ClienteRepository clienteRepository;
    private final CorretorRepository corretorRepository;
    private final SeguroRepository seguroRepository;
    private final PropostaRepository propostaRepository;

    public CotacaoService(
            CotacaoRepository cotacaoRepository,
            ClienteRepository clienteRepository,
            CorretorRepository corretorRepository,
            SeguroRepository seguroRepository,
            PropostaRepository propostaRepository
    ) {
        this.cotacaoRepository = cotacaoRepository;
        this.clienteRepository = clienteRepository;
        this.corretorRepository = corretorRepository;
        this.seguroRepository = seguroRepository;
        this.propostaRepository = propostaRepository;
    }

    public List<CotacaoResponse> listar(Long clienteId, Long corretorId, String situacao) {
        if (clienteId != null) {
            return cotacaoRepository.findByClienteId(clienteId).stream().map(this::toResponse).toList();
        }
        if (corretorId != null) {
            return cotacaoRepository.findByCorretorId(corretorId).stream().map(this::toResponse).toList();
        }
        if (situacao != null && !situacao.isBlank()) {
            return cotacaoRepository.findBySituacao(situacao).stream().map(this::toResponse).toList();
        }
        return cotacaoRepository.findAll().stream().map(this::toResponse).toList();
    }

    public CotacaoResponse buscarPorId(Long id) {
        Cotacao cotacao = buscarEntidadePorId(id);
        return toResponse(cotacao);
    }

    public Cotacao buscarEntidadePorId(Long id) {
        return cotacaoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cotação não encontrada com id: " + id));
    }

    @Transactional
    public CotacaoResponse criar(CotacaoRequest request) {
        Cliente cliente = clienteRepository.findById(request.clienteId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado com id: " + request.clienteId()));

        Seguro seguro = seguroRepository.findById(request.seguroId())
                .orElseThrow(() -> new IllegalArgumentException("Seguro não encontrado com id: " + request.seguroId()));

        Corretor corretor = null;
        if (request.corretorId() != null) {
            corretor = corretorRepository.findById(request.corretorId())
                    .orElseThrow(() -> new IllegalArgumentException("Corretor não encontrado com id: " + request.corretorId()));
        } else {
            var todosCorretores = corretorRepository.findAll();
            if (!todosCorretores.isEmpty()) {
                corretor = todosCorretores.get(0);
            }
        }

        var valor = request.valor() != null ? request.valor() : seguro.getValorBase();

        Cotacao cotacao = new Cotacao(
                null,
                LocalDateTime.now(),
                valor,
                request.situacao() != null ? request.situacao() : "SOLICITADA",
                cliente,
                corretor,
                seguro
        );

        Cotacao salva = cotacaoRepository.save(cotacao);
        return toResponse(salva);
    }

    @Transactional
    public CotacaoResponse atualizarSituacao(Long id, String novaSituacao, Long corretorId) {
        Cotacao cotacao = buscarEntidadePorId(id);
        cotacao.setSituacao(novaSituacao.toUpperCase());

        if (corretorId != null) {
            Corretor corretor = corretorRepository.findById(corretorId)
                    .orElseThrow(() -> new IllegalArgumentException("Corretor não encontrado com id: " + corretorId));
            cotacao.setCorretor(corretor);
        }

        return toResponse(cotacaoRepository.save(cotacao));
    }

    public CotacaoResponse toResponse(Cotacao c) {
        List<PropostaResponse> propostas = new ArrayList<>();
        propostaRepository.findByCotacaoId(c.getId()).ifPresent(p -> {
            propostas.add(new PropostaResponse(
                    p.getId(),
                    p.getCondicoes(),
                    p.getSituacao(),
                    c.getId(),
                    c.getValor(),
                    c.getValor(),
                    c.getDataSolicitacao(),
                    c.getCliente() != null ? c.getCliente().getId() : null,
                    c.getCliente() != null ? c.getCliente().getNome() : null,
                    c.getCorretor() != null ? c.getCorretor().getId() : null,
                    c.getCorretor() != null ? c.getCorretor().getNome() : null,
                    c.getSeguro() != null ? c.getSeguro().getId() : null,
                    c.getSeguro() != null ? c.getSeguro().getNome() : null
            ));
        });

        String dataCotacao = c.getDataSolicitacao() != null
                ? c.getDataSolicitacao().toLocalDate().toString()
                : "";

        String info = c.getSeguro() != null && c.getSeguro().getDescricao() != null
                ? c.getSeguro().getDescricao()
                : "Solicitação de cotação registrada.";

        return new CotacaoResponse(
                c.getId(),
                c.getDataSolicitacao(),
                dataCotacao,
                c.getValor(),
                c.getSituacao(),
                c.getCliente() != null ? c.getCliente().getId() : null,
                c.getCliente() != null ? c.getCliente().getNome() : null,
                c.getCorretor() != null ? c.getCorretor().getId() : null,
                c.getCorretor() != null ? c.getCorretor().getNome() : "HCR Corretora",
                c.getSeguro() != null ? c.getSeguro().getId() : null,
                c.getSeguro() != null ? c.getSeguro().getNome() : null,
                info,
                propostas
        );
    }
}
