package com.hcr.corretora.features.dashboard;

import com.hcr.corretora.features.apolices.Apolice;
import com.hcr.corretora.features.apolices.ApoliceRepository;
import com.hcr.corretora.features.apolices.ParcelaPagamento;
import com.hcr.corretora.features.apolices.ParcelaPagamentoRepository;
import com.hcr.corretora.features.clientes.ClienteRepository;
import com.hcr.corretora.features.corretores.CorretorRepository;
import com.hcr.corretora.features.cotacoes.CotacaoRepository;
import com.hcr.corretora.features.dashboard.dto.DashboardResponse;
import com.hcr.corretora.features.propostas.Proposta;
import com.hcr.corretora.features.propostas.PropostaRepository;
import com.hcr.corretora.features.seguros.SeguroRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final ClienteRepository clienteRepository;
    private final CorretorRepository corretorRepository;
    private final SeguroRepository seguroRepository;
    private final ApoliceRepository apoliceRepository;
    private final CotacaoRepository cotacaoRepository;
    private final PropostaRepository propostaRepository;
    private final ParcelaPagamentoRepository parcelaPagamentoRepository;

    public DashboardService(
            ClienteRepository clienteRepository,
            CorretorRepository corretorRepository,
            SeguroRepository seguroRepository,
            ApoliceRepository apoliceRepository,
            CotacaoRepository cotacaoRepository,
            PropostaRepository propostaRepository,
            ParcelaPagamentoRepository parcelaPagamentoRepository
    ) {
        this.clienteRepository = clienteRepository;
        this.corretorRepository = corretorRepository;
        this.seguroRepository = seguroRepository;
        this.apoliceRepository = apoliceRepository;
        this.cotacaoRepository = cotacaoRepository;
        this.propostaRepository = propostaRepository;
        this.parcelaPagamentoRepository = parcelaPagamentoRepository;
    }

    public DashboardResponse obterMetricasGerais() {
        long totalClientes = clienteRepository.count();
        long totalCorretores = corretorRepository.count();
        long totalSeguros = seguroRepository.count();

        long ativas = apoliceRepository.countBySituacao("ATIVA");
        long vencidas = apoliceRepository.countBySituacao("VENCIDA");
        long emRenovacao = apoliceRepository.countBySituacao("EM_RENOVACAO");
        long canceladas = apoliceRepository.countBySituacao("CANCELADA");

        LocalDate hoje = LocalDate.now();
        List<Apolice> aVencer = apoliceRepository.findByDataTerminoBetweenAndSituacao(hoje, hoje.plusDays(30), "ATIVA");
        long proximasVencimento = aVencer.size();

        long cotacoesPendentes = cotacaoRepository.findBySituacao("SOLICITADA").size();
        long propostasPendentes = propostaRepository.findAll().stream()
                .filter(p -> "PENDENTE".equalsIgnoreCase(p.getSituacao()))
                .count();

        BigDecimal faturamentoEstimado = apoliceRepository.findBySituacao("ATIVA").stream()
                .map(a -> a.getValorPremio() != null ? a.getValorPremio() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRecebido = parcelaPagamentoRepository.findByStatus("PAGO").stream()
                .map(ParcelaPagamento::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DashboardResponse(
                totalClientes,
                totalCorretores,
                totalSeguros,
                ativas,
                vencidas,
                emRenovacao,
                canceladas,
                proximasVencimento,
                cotacoesPendentes,
                propostasPendentes,
                faturamentoEstimado,
                totalRecebido
        );
    }
}
