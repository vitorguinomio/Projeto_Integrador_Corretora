package com.hcr.corretora.features.relatorios;

import com.hcr.corretora.features.apolices.Apolice;
import com.hcr.corretora.features.apolices.ApoliceRepository;
import com.hcr.corretora.features.clientes.Cliente;
import com.hcr.corretora.features.clientes.ClienteRepository;
import com.hcr.corretora.features.corretores.Corretor;
import com.hcr.corretora.features.corretores.CorretorRepository;
import com.hcr.corretora.features.cotacoes.CotacaoRepository;
import com.hcr.corretora.features.relatorios.dto.RelatorioApoliceItem;
import com.hcr.corretora.features.relatorios.dto.RelatorioClienteItem;
import com.hcr.corretora.features.relatorios.dto.RelatorioCorretorItem;
import com.hcr.corretora.features.relatorios.dto.RelatorioSeguroItem;
import com.hcr.corretora.features.seguros.Seguro;
import com.hcr.corretora.features.seguros.SeguroRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class RelatorioService {

    private final ClienteRepository clienteRepository;
    private final CorretorRepository corretorRepository;
    private final SeguroRepository seguroRepository;
    private final ApoliceRepository apoliceRepository;
    private final CotacaoRepository cotacaoRepository;

    public RelatorioService(
            ClienteRepository clienteRepository,
            CorretorRepository corretorRepository,
            SeguroRepository seguroRepository,
            ApoliceRepository apoliceRepository,
            CotacaoRepository cotacaoRepository
    ) {
        this.clienteRepository = clienteRepository;
        this.corretorRepository = corretorRepository;
        this.seguroRepository = seguroRepository;
        this.apoliceRepository = apoliceRepository;
        this.cotacaoRepository = cotacaoRepository;
    }

    public List<RelatorioClienteItem> relatorioClientes() {
        List<Cliente> clientes = clienteRepository.findAll();
        List<RelatorioClienteItem> itens = new ArrayList<>();

        for (Cliente c : clientes) {
            List<Apolice> apolices = apoliceRepository.findByClienteId(c.getId());
            long ativas = apolices.stream().filter(a -> "ATIVA".equalsIgnoreCase(a.getSituacao())).count();
            BigDecimal totalPremio = apolices.stream()
                    .map(a -> a.getValorPremio() != null ? a.getValorPremio() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            itens.add(new RelatorioClienteItem(
                    c.getId(),
                    c.getNome(),
                    c.getCpfCnpj(),
                    c.getEmail(),
                    apolices.size(),
                    ativas,
                    totalPremio
            ));
        }

        return itens;
    }

    public List<RelatorioCorretorItem> relatorioCorretores() {
        List<Corretor> corretores = corretorRepository.findAll();
        List<RelatorioCorretorItem> itens = new ArrayList<>();

        for (Corretor c : corretores) {
            var cotacoes = cotacaoRepository.findByCorretorId(c.getId());
            var apolices = apoliceRepository.findByCorretorId(c.getId());
            BigDecimal totalPremio = apolices.stream()
                    .map(a -> a.getValorPremio() != null ? a.getValorPremio() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            itens.add(new RelatorioCorretorItem(
                    c.getId(),
                    c.getNome(),
                    c.getDadosProfissionais(),
                    c.getStatus(),
                    cotacoes.size(),
                    apolices.size(),
                    totalPremio
            ));
        }

        return itens;
    }

    public List<RelatorioSeguroItem> relatorioSeguros() {
        List<Seguro> seguros = seguroRepository.findAll();
        List<Apolice> todasApolices = apoliceRepository.findAll();
        List<RelatorioSeguroItem> itens = new ArrayList<>();

        for (Seguro s : seguros) {
            var apolicesSeguro = todasApolices.stream()
                    .filter(a -> a.getSeguro() != null && a.getSeguro().getId().equals(s.getId()))
                    .toList();

            BigDecimal totalPremio = apolicesSeguro.stream()
                    .map(a -> a.getValorPremio() != null ? a.getValorPremio() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            itens.add(new RelatorioSeguroItem(
                    s.getId(),
                    s.getNome(),
                    s.getValorBase(),
                    apolicesSeguro.size(),
                    totalPremio
            ));
        }

        return itens;
    }

    public List<RelatorioApoliceItem> relatorioApolices(String situacao) {
        List<Apolice> apolices = (situacao != null && !situacao.isBlank())
                ? apoliceRepository.findBySituacao(situacao.toUpperCase())
                : apoliceRepository.findAll();

        return apolices.stream().map(a -> {
            long pagas = a.getParcelas() != null ? a.getParcelas().stream().filter(p -> "PAGO".equalsIgnoreCase(p.getStatus())).count() : 0;
            long pendentes = a.getParcelas() != null ? a.getParcelas().stream().filter(p -> !"PAGO".equalsIgnoreCase(p.getStatus())).count() : 0;

            return new RelatorioApoliceItem(
                    a.getId(),
                    a.getNumeroApolice(),
                    a.getCliente() != null ? a.getCliente().getNome() : null,
                    a.getCorretor() != null ? a.getCorretor().getNome() : null,
                    a.getSeguro() != null ? a.getSeguro().getNome() : null,
                    a.getDataInicio(),
                    a.getDataTermino(),
                    a.getSituacao(),
                    a.getValorPremio(),
                    pagas,
                    pendentes
            );
        }).toList();
    }
}
