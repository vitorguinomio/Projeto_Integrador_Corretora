package com.hcr.corretora.features.apolices;

import com.hcr.corretora.features.alertas.NotificacaoAlerta;
import com.hcr.corretora.features.alertas.NotificacaoAlertaRepository;
import com.hcr.corretora.features.apolices.dto.ApoliceRequest;
import com.hcr.corretora.features.apolices.dto.ApoliceResponse;
import com.hcr.corretora.features.apolices.dto.AtualizarParcelaRequest;
import com.hcr.corretora.features.apolices.dto.ParcelaResponse;
import com.hcr.corretora.features.apolices.dto.RenovacaoRequest;
import com.hcr.corretora.features.auditoria.AuditoriaService;
import com.hcr.corretora.features.clientes.Cliente;
import com.hcr.corretora.features.clientes.ClienteRepository;
import com.hcr.corretora.features.corretores.Corretor;
import com.hcr.corretora.features.corretores.CorretorRepository;
import com.hcr.corretora.features.seguros.Seguro;
import com.hcr.corretora.features.seguros.SeguroRepository;
import com.hcr.corretora.features.usuarios.Usuario;
import com.hcr.corretora.features.usuarios.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ApoliceService {

    private final ApoliceRepository apoliceRepository;
    private final ClienteRepository clienteRepository;
    private final CorretorRepository corretorRepository;
    private final SeguroRepository seguroRepository;
    private final ParcelaPagamentoRepository parcelaPagamentoRepository;
    private final NotificacaoAlertaRepository notificacaoAlertaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;

    public ApoliceService(
            ApoliceRepository apoliceRepository,
            ClienteRepository clienteRepository,
            CorretorRepository corretorRepository,
            SeguroRepository seguroRepository,
            ParcelaPagamentoRepository parcelaPagamentoRepository,
            NotificacaoAlertaRepository notificacaoAlertaRepository,
            UsuarioRepository usuarioRepository,
            AuditoriaService auditoriaService
    ) {
        this.apoliceRepository = apoliceRepository;
        this.clienteRepository = clienteRepository;
        this.corretorRepository = corretorRepository;
        this.seguroRepository = seguroRepository;
        this.parcelaPagamentoRepository = parcelaPagamentoRepository;
        this.notificacaoAlertaRepository = notificacaoAlertaRepository;
        this.usuarioRepository = usuarioRepository;
        this.auditoriaService = auditoriaService;
    }

    public List<ApoliceResponse> pesquisar(String termo, String situacao, Long clienteId, Long corretorId) {
        boolean semFiltros = (termo == null || termo.isBlank()) && (situacao == null || situacao.isBlank()) && clienteId == null && corretorId == null;
        List<Apolice> lista = semFiltros
                ? apoliceRepository.findAll()
                : apoliceRepository.pesquisar(
                        (termo != null && !termo.isBlank()) ? termo.trim() : null,
                        (situacao != null && !situacao.isBlank()) ? situacao.toUpperCase() : null,
                        clienteId,
                        corretorId
                );
        return lista.stream().map(this::toResponse).toList();
    }

    public ApoliceResponse buscarPorId(Long id) {
        Apolice apolice = buscarEntidadePorId(id);
        return toResponse(apolice);
    }

    public Apolice buscarEntidadePorId(Long id) {
        return apoliceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Apólice não encontrada com id: " + id));
    }

    @Transactional
    public ApoliceResponse criar(ApoliceRequest request) {
        Cliente cliente = clienteRepository.findById(request.clienteId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado com id: " + request.clienteId()));

        Corretor corretor = corretorRepository.findById(request.corretorId())
                .orElseThrow(() -> new IllegalArgumentException("Corretor não encontrado com id: " + request.corretorId()));

        Seguro seguro = seguroRepository.findById(request.seguroId())
                .orElseThrow(() -> new IllegalArgumentException("Seguro não encontrado com id: " + request.seguroId()));

        if (request.dataTermino().isBefore(request.dataInicio()) || request.dataTermino().isEqual(request.dataInicio())) {
            throw new IllegalArgumentException("A data de término da vigência deve ser posterior à data de início.");
        }

        String numApolice = request.numeroApolice();
        if (numApolice == null || numApolice.isBlank()) {
            numApolice = "APO-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } else if (apoliceRepository.existsByNumeroApolice(numApolice.trim())) {
            throw new IllegalArgumentException("Já existe uma apólice cadastrada com o número: " + numApolice);
        } else {
            numApolice = numApolice.trim();
        }

        BigDecimal premio = request.valorPremio() != null
                ? request.valorPremio()
                : (request.premio() != null ? request.premio() : seguro.getValorBase());

        Apolice apolice = new Apolice(
                null,
                numApolice,
                request.dataInicio(),
                request.dataTermino(),
                request.situacao() != null ? request.situacao().toUpperCase() : "ATIVA",
                premio,
                cliente,
                corretor,
                seguro,
                null
        );

        int parcelasQtd = (request.quantidadeParcelas() != null && request.quantidadeParcelas() > 0)
                ? request.quantidadeParcelas() : 12;

        gerarParcelas(apolice, premio, request.dataInicio(), parcelasQtd);

        Apolice salva = apoliceRepository.save(apolice);

        auditoriaService.registrarOperacao(
                "CRIACAO",
                "apolice",
                "Emissão da apólice " + salva.getNumeroApolice() + " para " + cliente.getNome() + " com " + parcelasQtd + " parcela(s)"
        );

        Usuario dest = corretor.getUsuario() != null ? corretor.getUsuario() : obterPrimeiroUsuario();
        if (dest != null) {
            notificacaoAlertaRepository.save(new NotificacaoAlerta(
                    null,
                    "Nova apólice " + salva.getNumeroApolice() + " (" + seguro.getNome() + ") emitida para o cliente " + cliente.getNome() + ".",
                    "PENDENTE",
                    LocalDateTime.now(),
                    dest
            ));
        }

        return toResponse(salva);
    }

    @Transactional
    public ApoliceResponse renovar(Long id, RenovacaoRequest request) {
        Apolice apoliceAntiga = buscarEntidadePorId(id);

        // Localiza o 1º contrato da cadeia de renovação para manter a data de início original
        Apolice primeiroContrato = apoliceAntiga;
        int guard = 0;
        while (primeiroContrato.getApoliceAnterior() != null && guard < 20) {
            primeiroContrato = primeiroContrato.getApoliceAnterior();
            guard++;
        }

        LocalDate dataInicioOriginal = request.novaDataInicio() != null
                ? request.novaDataInicio()
                : primeiroContrato.getDataInicio();

        if (request.novaDataTermino().isBefore(dataInicioOriginal) || request.novaDataTermino().isEqual(dataInicioOriginal)) {
            throw new IllegalArgumentException("A nova data de término deve ser posterior à data de início do 1º contrato (" + dataInicioOriginal + ").");
        }

        apoliceAntiga.setSituacao("EM_RENOVACAO");
        apoliceRepository.save(apoliceAntiga);

        String novoNumero = "APO-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        BigDecimal novoPremio = request.novoValorPremio() != null
                ? request.novoValorPremio()
                : (request.novoPremio() != null ? request.novoPremio() : apoliceAntiga.getValorPremio());

        Apolice novaApolice = new Apolice(
                null,
                novoNumero,
                dataInicioOriginal,
                request.novaDataTermino(),
                "ATIVA",
                novoPremio,
                apoliceAntiga.getCliente(),
                apoliceAntiga.getCorretor(),
                apoliceAntiga.getSeguro(),
                apoliceAntiga
        );

        int parcelasQtd = (request.quantidadeParcelas() != null && request.quantidadeParcelas() > 0)
                ? request.quantidadeParcelas() : 12;

        LocalDate baseVencimentoParcelas = apoliceAntiga.getDataTermino() != null && apoliceAntiga.getDataTermino().isAfter(LocalDate.now())
                ? apoliceAntiga.getDataTermino()
                : LocalDate.now();

        gerarParcelas(novaApolice, novoPremio, baseVencimentoParcelas, parcelasQtd);

        Apolice salva = apoliceRepository.save(novaApolice);
        auditoriaService.registrarOperacao(
                "RENOVAR",
                "apolice",
                "Renovação da apólice " + apoliceAntiga.getNumeroApolice() + " -> " + salva.getNumeroApolice() + " mantendo data inicial " + dataInicioOriginal
        );
        return toResponse(salva);
    }

    @Transactional
    public ApoliceResponse cancelar(Long id) {
        Apolice apolice = buscarEntidadePorId(id);
        apolice.setSituacao("CANCELADA");
        Apolice salva = apoliceRepository.save(apolice);
        auditoriaService.registrarOperacao("CANCELAR", "apolice", "Cancelamento da apólice " + salva.getNumeroApolice());
        return toResponse(salva);
    }

    public List<ApoliceResponse> listarAlertasVencimento(int dias) {
        LocalDate hoje = LocalDate.now();
        LocalDate limite = hoje.plusDays(dias);
        return apoliceRepository.findByDataTerminoBetweenAndSituacao(hoje, limite, "ATIVA").stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ParcelaResponse> listarParcelasPorApolice(Long apoliceId) {
        List<ParcelaPagamento> parcelas = parcelaPagamentoRepository.findByApoliceIdOrderByDataVencimentoAscIdAsc(apoliceId);
        List<ParcelaResponse> result = new ArrayList<>();
        for (int i = 0; i < parcelas.size(); i++) {
            result.add(toParcelaResponse(parcelas.get(i), i + 1));
        }
        return result;
    }

    @Transactional
    public ParcelaResponse atualizarStatusParcela(Long parcelaId, AtualizarParcelaRequest request) {
        ParcelaPagamento parcela = parcelaPagamentoRepository.findById(parcelaId)
                .orElseThrow(() -> new IllegalArgumentException("Parcela não encontrada com id: " + parcelaId));

        String novoStatus = (request != null && request.status() != null && !request.status().isBlank())
                ? request.status().trim().toUpperCase()
                : "PAGO";

        if ("PAGA".equals(novoStatus)) {
            novoStatus = "PAGO";
        }

        String forma = null;
        if (request != null) {
            if (request.formaPagamento() != null && !request.formaPagamento().isBlank()) {
                forma = request.formaPagamento().trim();
            } else if (request.tipoPagamento() != null && !request.tipoPagamento().isBlank()) {
                forma = request.tipoPagamento().trim();
            }
        }

        parcela.setStatus(novoStatus);
        if ("PAGO".equals(novoStatus)) {
            parcela.setFormaPagamento(forma != null ? forma : (parcela.getFormaPagamento() != null ? parcela.getFormaPagamento() : "PIX"));
            if (parcela.getDataPagamento() == null) {
                parcela.setDataPagamento(LocalDate.now());
            }
        } else {
            parcela.setFormaPagamento(null);
            parcela.setDataPagamento(null);
        }

        ParcelaPagamento salva = parcelaPagamentoRepository.save(parcela);
        int numero = salva.getNumeroParcela() != null ? salva.getNumeroParcela() : 1;
        auditoriaService.registrarOperacao(
                "PAGAR",
                "parcela_pagamentos",
                "Parcela #" + numero + " (ID #" + salva.getId() + ") atualizada para " + salva.getStatus()
                        + (salva.getFormaPagamento() != null ? " via " + salva.getFormaPagamento() : "")
        );
        return toParcelaResponse(salva, numero);
    }

    private void gerarParcelas(Apolice apolice, BigDecimal total, LocalDate dataInicio, int qtd) {
        BigDecimal valorParcela = total.divide(BigDecimal.valueOf(qtd), 2, RoundingMode.HALF_UP);
        for (int i = 1; i <= qtd; i++) {
            LocalDate vencimento = dataInicio.plusMonths(i - 1);
            ParcelaPagamento parcela = new ParcelaPagamento(
                    null,
                    i,
                    valorParcela,
                    vencimento,
                    "PENDENTE",
                    null,
                    null,
                    apolice
            );
            apolice.addParcela(parcela);
        }
    }

    private Usuario obterPrimeiroUsuario() {
        List<Usuario> all = usuarioRepository.findAll();
        return all.isEmpty() ? null : all.get(0);
    }

    public ApoliceResponse toResponse(Apolice a) {
        List<ParcelaResponse> parcelasDto = new ArrayList<>();
        if (a.getParcelas() != null) {
            List<ParcelaPagamento> ordenadas = a.getParcelas().stream()
                    .sorted(Comparator.comparing(ParcelaPagamento::getDataVencimento, Comparator.nullsLast(Comparator.naturalOrder()))
                            .thenComparing(ParcelaPagamento::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                    .toList();
            for (int i = 0; i < ordenadas.size(); i++) {
                parcelasDto.add(toParcelaResponse(ordenadas.get(i), i + 1));
            }
        }

        return new ApoliceResponse(
                a.getId(),
                a.getNumeroApolice(),
                a.getDataInicio(),
                a.getDataTermino(),
                a.getSituacao(),
                a.getValorPremio(),
                a.getValorPremio(),
                a.getCliente() != null ? a.getCliente().getId() : null,
                a.getCliente() != null ? a.getCliente().getNome() : null,
                a.getCorretor() != null ? a.getCorretor().getId() : null,
                a.getCorretor() != null ? a.getCorretor().getNome() : null,
                a.getSeguro() != null ? a.getSeguro().getId() : null,
                a.getSeguro() != null ? a.getSeguro().getNome() : null,
                a.getApoliceAnterior() != null ? a.getApoliceAnterior().getId() : null,
                parcelasDto
        );
    }

    public ParcelaResponse toParcelaResponse(ParcelaPagamento p, int fallbackNumero) {
        int num = p.getNumeroParcela() != null ? p.getNumeroParcela() : fallbackNumero;
        String st = p.getStatus() != null ? p.getStatus().toUpperCase() : "PENDENTE";
        String sitDisplay = "PAGO".equals(st) ? "Paga" : ("ATRASADO".equals(st) ? "Atrasada" : "Pendente");
        return new ParcelaResponse(
                p.getId(),
                num,
                p.getValor(),
                p.getDataVencimento(),
                st,
                sitDisplay,
                p.getFormaPagamento(),
                p.getFormaPagamento(),
                p.getDataPagamento(),
                p.getApolice() != null ? p.getApolice().getId() : null
        );
    }
}
