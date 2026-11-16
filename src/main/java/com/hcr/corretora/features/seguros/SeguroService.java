package com.hcr.corretora.features.seguros;

import com.hcr.corretora.features.auditoria.AuditoriaService;
import com.hcr.corretora.features.seguros.dto.CoberturaDto;
import com.hcr.corretora.features.seguros.dto.SeguroRequest;
import com.hcr.corretora.features.seguros.dto.SeguroResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class SeguroService {

    private final SeguroRepository seguroRepository;
    private final CoberturaRepository coberturaRepository;
    private final AuditoriaService auditoriaService;

    public SeguroService(
            SeguroRepository seguroRepository,
            CoberturaRepository coberturaRepository,
            AuditoriaService auditoriaService
    ) {
        this.seguroRepository = seguroRepository;
        this.coberturaRepository = coberturaRepository;
        this.auditoriaService = auditoriaService;
    }

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
        if (seguroRepository.existsByNome(request.nome().trim())) {
            throw new IllegalArgumentException("Já existe um tipo de seguro com o nome: " + request.nome());
        }

        BigDecimal valorBase = request.valorBase() != null
                ? request.valorBase()
                : (request.premioBase() != null ? request.premioBase() : BigDecimal.ZERO);

        String descricao = (request.descricao() != null && !request.descricao().isBlank())
                ? request.descricao().trim()
                : "Seguro " + request.nome().trim() + " com proteção completa HCR.";

        String caracteristicas = (request.caracteristicas() != null && !request.caracteristicas().isBlank())
                ? request.caracteristicas().trim()
                : (request.tipo() != null ? request.tipo().trim() : "Geral");

        Seguro seguro = new Seguro(
                null,
                request.nome().trim(),
                descricao,
                caracteristicas,
                valorBase
        );

        if (request.coberturas() != null && !request.coberturas().isEmpty()) {
            for (CoberturaDto c : request.coberturas()) {
                String descCob = (c.nome() != null && !c.nome().isBlank()) ? c.nome().trim() : c.descricao();
                BigDecimal valCob = c.valor() != null ? c.valor() : (c.valorLimite() != null ? c.valorLimite() : BigDecimal.ZERO);
                if (descCob != null && !descCob.isBlank()) {
                    Cobertura cob = new Cobertura(null, descCob, valCob, seguro);
                    seguro.addCobertura(cob);
                }
            }
        } else {
            seguro.addCobertura(new Cobertura(null, "Cobertura Básica " + request.nome().trim(), valorBase.multiply(BigDecimal.TEN), seguro));
        }

        Seguro salvo = seguroRepository.save(seguro);
        auditoriaService.registrarOperacao(
                "CRIACAO",
                "seguro",
                "Cadastro do produto de seguro '" + salvo.getNome() + "' com " + salvo.getCoberturas().size() + " cobertura(s)"
        );
        return toResponse(salvo);
    }

    @Transactional
    public SeguroResponse atualizar(Long id, SeguroRequest request) {
        Seguro seguro = buscarEntidadePorId(id);

        if (!seguro.getNome().equalsIgnoreCase(request.nome()) && seguroRepository.existsByNome(request.nome())) {
            throw new IllegalArgumentException("Já existe outro seguro com o nome: " + request.nome());
        }

        seguro.setNome(request.nome().trim());
        if (request.descricao() != null && !request.descricao().isBlank()) {
            seguro.setDescricao(request.descricao().trim());
        }
        if (request.caracteristicas() != null && !request.caracteristicas().isBlank()) {
            seguro.setCaracteristicas(request.caracteristicas().trim());
        } else if (request.tipo() != null && !request.tipo().isBlank()) {
            seguro.setCaracteristicas(request.tipo().trim());
        }

        BigDecimal valorBase = request.valorBase() != null ? request.valorBase() : request.premioBase();
        if (valorBase != null) {
            seguro.setValorBase(valorBase);
        }

        seguro.getCoberturas().clear();
        if (request.coberturas() != null) {
            for (CoberturaDto c : request.coberturas()) {
                String descCob = (c.nome() != null && !c.nome().isBlank()) ? c.nome().trim() : c.descricao();
                BigDecimal valCob = c.valor() != null ? c.valor() : (c.valorLimite() != null ? c.valorLimite() : BigDecimal.ZERO);
                if (descCob != null && !descCob.isBlank()) {
                    Cobertura cob = new Cobertura(null, descCob, valCob, seguro);
                    seguro.addCobertura(cob);
                }
            }
        }

        Seguro salvo = seguroRepository.save(seguro);
        auditoriaService.registrarOperacao("ATUALIZAR", "seguro", "Atualização do seguro '" + salvo.getNome() + "'");
        return toResponse(salvo);
    }

    @Transactional
    public CoberturaDto adicionarCobertura(Long seguroId, CoberturaDto dto) {
        Seguro seguro = buscarEntidadePorId(seguroId);
        String descCob = (dto.nome() != null && !dto.nome().isBlank()) ? dto.nome().trim() : dto.descricao();
        if (descCob == null || descCob.isBlank()) {
            throw new IllegalArgumentException("O nome/descrição da cobertura é obrigatório.");
        }
        BigDecimal valCob = dto.valor() != null ? dto.valor() : (dto.valorLimite() != null ? dto.valorLimite() : BigDecimal.ZERO);
        Cobertura cobertura = new Cobertura(null, descCob, valCob, seguro);
        Cobertura salva = coberturaRepository.save(cobertura);
        auditoriaService.registrarOperacao(
                "CRIACAO",
                "cobertura",
                "Inclusão da cobertura '" + salva.getDescricao() + "' no seguro '" + seguro.getNome() + "'"
        );
        return new CoberturaDto(salva.getId(), salva.getDescricao(), salva.getDescricao(), salva.getValor(), salva.getValor());
    }

    @Transactional
    public void removerCobertura(Long coberturaId) {
        coberturaRepository.deleteById(coberturaId);
        auditoriaService.registrarOperacao("EXCLUIR", "cobertura", "Remoção da cobertura ID #" + coberturaId);
    }

    public SeguroResponse toResponse(Seguro seguro) {
        List<CoberturaDto> coberturasDto = seguro.getCoberturas() != null ? seguro.getCoberturas().stream()
                .map(c -> new CoberturaDto(c.getId(), c.getDescricao(), c.getDescricao(), c.getValor(), c.getValor()))
                .toList() : new ArrayList<>();

        String tipo = inferirTipo(seguro.getNome(), seguro.getCaracteristicas());

        return new SeguroResponse(
                seguro.getId(),
                seguro.getNome(),
                seguro.getDescricao(),
                seguro.getCaracteristicas(),
                tipo,
                seguro.getValorBase(),
                seguro.getValorBase(),
                coberturasDto
        );
    }

    private String inferirTipo(String nome, String caracteristicas) {
        String txt = ((nome != null ? nome : "") + " " + (caracteristicas != null ? caracteristicas : "")).toLowerCase();
        if (txt.contains("auto") || txt.contains("veíc") || txt.contains("frota")) return "Auto";
        if (txt.contains("resid") || txt.contains("casa") || txt.contains("imóv")) return "Residencial";
        if (txt.contains("vida") || txt.contains("acidente")) return "Vida";
        if (txt.contains("empres") || txt.contains("comerc")) return "Empresarial";
        if (txt.contains("saúde") || txt.contains("odont")) return "Saúde";
        return "Geral";
    }
}
