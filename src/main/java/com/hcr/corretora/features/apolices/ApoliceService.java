package com.hcr.corretora.features.apolices;

import com.hcr.corretora.features.apolices.dto.ApoliceRequest;
import com.hcr.corretora.features.apolices.dto.AtualizacaoApoliceRequest;
import com.hcr.corretora.features.apolices.dto.ApoliceResponse;
import com.hcr.corretora.features.apolices.dto.ParcelaResponse;
import com.hcr.corretora.features.apolices.dto.RenovacaoRequest;
import com.hcr.corretora.features.clientes.Cliente;
import com.hcr.corretora.features.clientes.ClienteRepository;
import com.hcr.corretora.features.corretores.Corretor;
import com.hcr.corretora.features.corretores.CorretorRepository;
import com.hcr.corretora.features.seguros.Seguro;
import com.hcr.corretora.features.seguros.SeguroRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ApoliceService {

    private final ApoliceRepository apoliceRepository;
    private final ClienteRepository clienteRepository;
    private final CorretorRepository corretorRepository;
    private final SeguroRepository seguroRepository;
    private final ParcelaPagamentoRepository parcelaPagamentoRepository;

    public ApoliceService(
            ApoliceRepository apoliceRepository,
            ClienteRepository clienteRepository,
            CorretorRepository corretorRepository,
            SeguroRepository seguroRepository,
            ParcelaPagamentoRepository parcelaPagamentoRepository
    ) {
        this.apoliceRepository = apoliceRepository;
        this.clienteRepository = clienteRepository;
        this.corretorRepository = corretorRepository;
        this.seguroRepository = seguroRepository;
        this.parcelaPagamentoRepository = parcelaPagamentoRepository;
    }

    @Transactional(readOnly = true)
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

    @Transactional(readOnly = true)
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

        validarVigencia(request.dataInicio(), request.dataTermino());

        String numApolice = request.numeroApolice();
        if (numApolice == null || numApolice.isBlank()) {
            numApolice = "APO-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } else if (apoliceRepository.existsByNumeroApolice(numApolice)) {
            throw new IllegalArgumentException("Já existe uma apólice cadastrada com o número: " + numApolice);
        }

        BigDecimal premio = request.valorPremio() != null ? request.valorPremio() : seguro.getValorBase();

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
        return toResponse(salva);
    }

    /**
     * Alteração de uma apólice ativa (RF13): corretor, vigência e prêmio.
     * Se o prêmio mudar, as parcelas já pagas são mantidas e o saldo restante
     * (novo prêmio - valor pago) é redistribuído entre as parcelas pendentes.
     */
    @Transactional
    public ApoliceResponse atualizar(Long id, AtualizacaoApoliceRequest request) {
        Apolice apolice = buscarEntidadePorId(id);
        if (!"ATIVA".equals(apolice.getSituacao())) {
            throw new IllegalArgumentException("Somente apólices ativas podem ser alteradas.");
        }
        validarVigencia(request.dataInicio(), request.dataTermino());

        Corretor corretor = corretorRepository.findById(request.corretorId())
                .orElseThrow(() -> new IllegalArgumentException("Corretor não encontrado com id: " + request.corretorId()));

        BigDecimal novoPremio = request.valorPremio().setScale(2, RoundingMode.HALF_UP);
        if (apolice.getValorPremio() == null || novoPremio.compareTo(apolice.getValorPremio()) != 0) {
            redistribuirPremio(apolice, novoPremio);
        }

        apolice.setCorretor(corretor);
        apolice.setDataInicio(request.dataInicio());
        apolice.setDataTermino(request.dataTermino());
        apolice.setValorPremio(novoPremio);
        return toResponse(apoliceRepository.save(apolice));
    }

    private void redistribuirPremio(Apolice apolice, BigDecimal novoPremio) {
        List<ParcelaPagamento> pendentes = apolice.getParcelas().stream()
                .filter(p -> !"PAGO".equals(p.getStatus()))
                .sorted((a, b) -> a.getDataVencimento().compareTo(b.getDataVencimento()))
                .toList();
        BigDecimal pago = apolice.getParcelas().stream()
                .filter(p -> "PAGO".equals(p.getStatus()))
                .map(ParcelaPagamento::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal restante = novoPremio.subtract(pago);

        if (restante.signum() < 0) {
            throw new IllegalArgumentException("O novo prêmio (" + moeda(novoPremio) + ") é menor que o valor já pago ("
                    + moeda(pago) + ").");
        }
        if (pendentes.isEmpty()) {
            throw new IllegalArgumentException("Todas as parcelas desta apólice já foram pagas; o prêmio não pode ser alterado.");
        }

        BigDecimal valorParcela = restante.divide(BigDecimal.valueOf(pendentes.size()), 2, RoundingMode.DOWN);
        BigDecimal distribuido = BigDecimal.ZERO;
        for (int i = 0; i < pendentes.size(); i++) {
            // a última parcela recebe a diferença de arredondamento
            BigDecimal valor = i == pendentes.size() - 1 ? restante.subtract(distribuido) : valorParcela;
            pendentes.get(i).setValor(valor);
            distribuido = distribuido.add(valor);
        }
    }

    @Transactional
    public ApoliceResponse renovar(Long id, RenovacaoRequest request) {
        Apolice apoliceAntiga = buscarEntidadePorId(id);
        if (!"ATIVA".equals(apoliceAntiga.getSituacao())) {
            throw new IllegalArgumentException("Somente apólices ativas podem ser renovadas.");
        }
        validarVigencia(request.novaDataInicio(), request.novaDataTermino());

        apoliceAntiga.setSituacao("EM_RENOVACAO");
        apoliceRepository.save(apoliceAntiga);

        String novoNumero = "APO-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        BigDecimal novoPremio = request.novoValorPremio() != null ? request.novoValorPremio() : apoliceAntiga.getValorPremio();

        Apolice novaApolice = new Apolice(
                null,
                novoNumero,
                request.novaDataInicio(),
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

        gerarParcelas(novaApolice, novoPremio, request.novaDataInicio(), parcelasQtd);

        Apolice salva = apoliceRepository.save(novaApolice);
        return toResponse(salva);
    }

    @Transactional
    public ApoliceResponse cancelar(Long id, String motivo) {
        Apolice apolice = buscarEntidadePorId(id);
        if ("CANCELADA".equals(apolice.getSituacao()) || "VENCIDA".equals(apolice.getSituacao())) {
            throw new IllegalArgumentException("Esta apólice já está " + apolice.getSituacao().toLowerCase() + ".");
        }
        apolice.setSituacao("CANCELADA");
        apolice.setMotivoCancelamento(motivo != null && !motivo.isBlank() ? motivo.trim() : null);
        apolice.setDataCancelamento(LocalDate.now());
        return toResponse(apoliceRepository.save(apolice));
    }

    /**
     * Marca como VENCIDA as apólices cuja vigência terminou (RF15). Inclui as que estavam
     * EM_RENOVACAO: a renovação já gerou uma nova apólice, e a antiga encerra no fim da vigência.
     */
    @Transactional
    public int marcarApolicesVencidas() {
        List<Apolice> vencidas = apoliceRepository.findBySituacaoInAndDataTerminoBefore(
                List.of("ATIVA", "EM_RENOVACAO"), LocalDate.now());
        vencidas.forEach(a -> a.setSituacao("VENCIDA"));
        apoliceRepository.saveAll(vencidas);
        return vencidas.size();
    }

    private static String moeda(BigDecimal valor) {
        return java.text.NumberFormat.getCurrencyInstance(java.util.Locale.forLanguageTag("pt-BR"))
                .format(valor).replace(' ', ' ');
    }

    private void validarVigencia(LocalDate inicio, LocalDate termino) {
        if (inicio != null && termino != null && !termino.isAfter(inicio)) {
            throw new IllegalArgumentException("A data de término deve ser posterior à data de início da vigência.");
        }
    }

    @Transactional(readOnly = true)
    public List<ApoliceResponse> listarAlertasVencimento(int dias) {
        LocalDate hoje = LocalDate.now();
        LocalDate limite = hoje.plusDays(dias);
        return apoliceRepository.findByDataTerminoBetweenAndSituacao(hoje, limite, "ATIVA").stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ParcelaResponse> listarParcelasPorApolice(Long apoliceId) {
        return parcelaPagamentoRepository.findByApoliceId(apoliceId).stream()
                .map(this::toParcelaResponse)
                .toList();
    }

    @Transactional
    public ParcelaResponse atualizarStatusParcela(Long parcelaId, String status) {
        ParcelaPagamento parcela = parcelaPagamentoRepository.findById(parcelaId)
                .orElseThrow(() -> new IllegalArgumentException("Parcela não encontrada com id: " + parcelaId));

        parcela.setStatus(status.toUpperCase());
        return toParcelaResponse(parcelaPagamentoRepository.save(parcela));
    }

    private void gerarParcelas(Apolice apolice, BigDecimal total, LocalDate dataInicio, int qtd) {
        BigDecimal valorParcela = total.divide(BigDecimal.valueOf(qtd), 2, RoundingMode.HALF_UP);
        for (int i = 1; i <= qtd; i++) {
            LocalDate vencimento = dataInicio.plusMonths(i - 1);
            ParcelaPagamento parcela = new ParcelaPagamento(null, valorParcela, vencimento, "PENDENTE", apolice);
            apolice.addParcela(parcela);
        }
    }

    public ApoliceResponse toResponse(Apolice a) {
        List<ParcelaResponse> parcelasDto = a.getParcelas() != null ? a.getParcelas().stream()
                .map(this::toParcelaResponse)
                .toList() : new ArrayList<>();

        return new ApoliceResponse(
                a.getId(),
                a.getNumeroApolice(),
                a.getDataInicio(),
                a.getDataTermino(),
                a.getSituacao(),
                a.getValorPremio(),
                a.getCliente() != null ? a.getCliente().getId() : null,
                a.getCliente() != null ? a.getCliente().getNome() : null,
                a.getCorretor() != null ? a.getCorretor().getId() : null,
                a.getCorretor() != null ? a.getCorretor().getNome() : null,
                a.getSeguro() != null ? a.getSeguro().getId() : null,
                a.getSeguro() != null ? a.getSeguro().getNome() : null,
                a.getApoliceAnterior() != null ? a.getApoliceAnterior().getId() : null,
                a.getMotivoCancelamento(),
                a.getDataCancelamento(),
                parcelasDto
        );
    }

    public ParcelaResponse toParcelaResponse(ParcelaPagamento p) {
        return new ParcelaResponse(
                p.getId(),
                p.getValor(),
                p.getDataVencimento(),
                p.getStatus(),
                p.getApolice() != null ? p.getApolice().getId() : null
        );
    }
}
