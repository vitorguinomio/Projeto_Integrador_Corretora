package com.hcr.corretora.core.init;

import com.hcr.corretora.features.administradores.Administrador;
import com.hcr.corretora.features.administradores.AdministradorRepository;
import com.hcr.corretora.features.alertas.NotificacaoAlerta;
import com.hcr.corretora.features.alertas.NotificacaoAlertaRepository;
import com.hcr.corretora.features.apolices.Apolice;
import com.hcr.corretora.features.apolices.ApoliceRepository;
import com.hcr.corretora.features.apolices.ParcelaPagamento;
import com.hcr.corretora.features.apolices.ParcelaPagamentoRepository;
import com.hcr.corretora.features.auditoria.AuditoriaService;
import com.hcr.corretora.features.clientes.Cliente;
import com.hcr.corretora.features.clientes.ClienteRepository;
import com.hcr.corretora.features.clientes.Endereco;
import com.hcr.corretora.features.clientes.Telefone;
import com.hcr.corretora.features.corretores.Corretor;
import com.hcr.corretora.features.corretores.CorretorRepository;
import com.hcr.corretora.features.cotacoes.Cotacao;
import com.hcr.corretora.features.cotacoes.CotacaoRepository;
import com.hcr.corretora.features.propostas.Proposta;
import com.hcr.corretora.features.propostas.PropostaRepository;
import com.hcr.corretora.features.seguros.Cobertura;
import com.hcr.corretora.features.seguros.Seguro;
import com.hcr.corretora.features.seguros.SeguroRepository;
import com.hcr.corretora.features.usuarios.Usuario;
import com.hcr.corretora.features.usuarios.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final AdministradorRepository administradorRepository;
    private final CorretorRepository corretorRepository;
    private final ClienteRepository clienteRepository;
    private final SeguroRepository seguroRepository;
    private final CotacaoRepository cotacaoRepository;
    private final PropostaRepository propostaRepository;
    private final ApoliceRepository apoliceRepository;
    private final ParcelaPagamentoRepository parcelaPagamentoRepository;
    private final NotificacaoAlertaRepository notificacaoAlertaRepository;
    private final AuditoriaService auditoriaService;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UsuarioRepository usuarioRepository,
            AdministradorRepository administradorRepository,
            CorretorRepository corretorRepository,
            ClienteRepository clienteRepository,
            SeguroRepository seguroRepository,
            CotacaoRepository cotacaoRepository,
            PropostaRepository propostaRepository,
            ApoliceRepository apoliceRepository,
            ParcelaPagamentoRepository parcelaPagamentoRepository,
            NotificacaoAlertaRepository notificacaoAlertaRepository,
            AuditoriaService auditoriaService,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.administradorRepository = administradorRepository;
        this.corretorRepository = corretorRepository;
        this.clienteRepository = clienteRepository;
        this.seguroRepository = seguroRepository;
        this.cotacaoRepository = cotacaoRepository;
        this.propostaRepository = propostaRepository;
        this.apoliceRepository = apoliceRepository;
        this.parcelaPagamentoRepository = parcelaPagamentoRepository;
        this.notificacaoAlertaRepository = notificacaoAlertaRepository;
        this.auditoriaService = auditoriaService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (usuarioRepository.count() > 0) {
            return;
        }

        // 1. Criar Usuário Administrador
        Usuario userAdmin = new Usuario(
                null,
                "admin@hcr.com",
                passwordEncoder.encode("admin123"),
                "ADMINISTRADOR",
                "ATIVO"
        );
        userAdmin = usuarioRepository.save(userAdmin);

        Administrador admin = new Administrador(null, "Dalton Rezende (Gestão)", "Gerente Geral", userAdmin);
        administradorRepository.save(admin);

        // 2. Criar Corretores
        Usuario userCorretor1 = new Usuario(
                null,
                "carlos.silva@corretora.com",
                passwordEncoder.encode("corretor123"),
                "CORRETOR",
                "ATIVO"
        );
        userCorretor1 = usuarioRepository.save(userCorretor1);

        Corretor corretor1 = new Corretor(null, "Carlos Silva", "SUSEP-102938-SP", "ATIVO", userCorretor1);
        corretor1 = corretorRepository.save(corretor1);

        Usuario userCorretor2 = new Usuario(
                null,
                "ana.santos@corretora.com",
                passwordEncoder.encode("corretor123"),
                "CORRETOR",
                "ATIVO"
        );
        userCorretor2 = usuarioRepository.save(userCorretor2);

        Corretor corretor2 = new Corretor(null, "Ana Paula Santos", "SUSEP-204859-DF", "ATIVO", userCorretor2);
        corretor2 = corretorRepository.save(corretor2);

        // 3. Criar Clientes com Endereços e Telefones
        Usuario userCliente1 = new Usuario(
                null,
                "joao.silva@email.com",
                passwordEncoder.encode("cliente123"),
                "CLIENTE",
                "ATIVO"
        );
        userCliente1 = usuarioRepository.save(userCliente1);

        Cliente cliente1 = new Cliente(
                null,
                "João Pereira da Silva",
                "123.456.789-00",
                LocalDate.of(1988, 4, 12),
                "joao.silva@email.com",
                userCliente1
        );
        cliente1.addEndereco(new Endereco(null, "70000-000", "Asa Sul, Bloco B", "204", "Apto 301", "Asa Sul", "Brasília", "DF", cliente1));
        cliente1.addTelefone(new Telefone(null, "61", "98765-4321", "CELULAR", cliente1));
        cliente1 = clienteRepository.save(cliente1);

        Usuario userCliente2 = new Usuario(
                null,
                "mariana.souza@email.com",
                passwordEncoder.encode("cliente123"),
                "CLIENTE",
                "ATIVO"
        );
        userCliente2 = usuarioRepository.save(userCliente2);

        Cliente cliente2 = new Cliente(
                null,
                "Mariana de Souza Oliveira",
                "987.654.321-99",
                LocalDate.of(1993, 8, 20),
                "mariana.souza@email.com",
                userCliente2
        );
        cliente2.addEndereco(new Endereco(null, "71000-000", "Águas Claras, Rua 12", "15", "Residencial Solar", "Norte", "Brasília", "DF", cliente2));
        cliente2.addTelefone(new Telefone(null, "61", "99123-4567", "CELULAR", cliente2));
        cliente2 = clienteRepository.save(cliente2);

        // 4. Criar Seguros com Coberturas
        Seguro seguroAuto = new Seguro(
                null,
                "Seguro Automóvel Completo",
                "Proteção total para veículos de passeio e comerciais leves com cobertura 24h.",
                "Cobertura nacional, guincho ilimitado, proteção contra roubo, furto, colisão e danos a terceiros.",
                new BigDecimal("2400.00")
        );
        seguroAuto.addCobertura(new Cobertura(null, "Colisão e Incêndio", new BigDecimal("1200.00"), seguroAuto));
        seguroAuto.addCobertura(new Cobertura(null, "Roubo e Furto Qualificado", new BigDecimal("800.00"), seguroAuto));
        seguroAuto.addCobertura(new Cobertura(null, "Danos Materiais e Corporais a Terceiros", new BigDecimal("400.00"), seguroAuto));
        seguroAuto = seguroRepository.save(seguroAuto);

        Seguro seguroResidencial = new Seguro(
                null,
                "Seguro Residencial Premium",
                "Tranquilidade para sua casa ou apartamento com serviços emergenciais inclusos.",
                "Incêndio, raio, explosão, danos elétricos, chaveiro 24h, eletricista e encanador.",
                new BigDecimal("850.00")
        );
        seguroResidencial.addCobertura(new Cobertura(null, "Incêndio, Raio e Explosão", new BigDecimal("500.00"), seguroResidencial));
        seguroResidencial.addCobertura(new Cobertura(null, "Danos Elétricos", new BigDecimal("200.00"), seguroResidencial));
        seguroResidencial.addCobertura(new Cobertura(null, "Assistência Residencial 24h", new BigDecimal("150.00"), seguroResidencial));
        seguroResidencial = seguroRepository.save(seguroResidencial);

        Seguro seguroVida = new Seguro(
                null,
                "Seguro de Vida e Acidentes Pessoais",
                "Garantia de segurança e estabilidade financeira para seus entes queridos.",
                "Morte acidental, invalidez por acidente, auxílio funeral completo e assistência médica.",
                new BigDecimal("600.00")
        );
        seguroVida.addCobertura(new Cobertura(null, "Morte Qualquer Causa", new BigDecimal("350.00"), seguroVida));
        seguroVida.addCobertura(new Cobertura(null, "Invalidez Permanente Total ou Parcial", new BigDecimal("250.00"), seguroVida));
        seguroVida = seguroRepository.save(seguroVida);

        // 5. Criar Cotações e Propostas
        Cotacao cotacao1 = new Cotacao(
                null,
                LocalDateTime.now().minusDays(10),
                new BigDecimal("2400.00"),
                "APROVADA",
                cliente1,
                corretor1,
                seguroAuto
        );
        cotacao1 = cotacaoRepository.save(cotacao1);

        Proposta proposta1 = new Proposta(
                null,
                "Plano Automóvel com franquia reduzida de R$ 1.500,00, guincho ilimitado e carro reserva por 15 dias.",
                "ACEITA",
                cotacao1
        );
        propostaRepository.save(proposta1);

        Cotacao cotacao2 = new Cotacao(
                null,
                LocalDateTime.now().minusDays(2),
                new BigDecimal("850.00"),
                "SOLICITADA",
                cliente2,
                corretor2,
                seguroResidencial
        );
        cotacaoRepository.save(cotacao2);

        // 6. Criar Apólices e Parcelas
        // Apólice 1 (Ativa)
        Apolice apolice1 = new Apolice(
                null,
                "APO-2026-AUTO-001",
                LocalDate.now().minusDays(60),
                LocalDate.now().plusDays(305),
                "ATIVA",
                new BigDecimal("2400.00"),
                cliente1,
                corretor1,
                seguroAuto,
                null
        );
        BigDecimal valParcela1 = new BigDecimal("2400.00").divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        for (int i = 1; i <= 12; i++) {
            LocalDate venc = LocalDate.now().minusDays(60).plusMonths(i - 1);
            String st = (i <= 2) ? "PAGO" : "PENDENTE";
            apolice1.addParcela(new ParcelaPagamento(null, valParcela1, venc, st, apolice1));
        }
        apoliceRepository.save(apolice1);

        // Apólice 2 (Próxima do Vencimento - faltam 15 dias para testar Alerta RF27!)
        Apolice apolice2 = new Apolice(
                null,
                "APO-2026-RES-002",
                LocalDate.now().minusDays(350),
                LocalDate.now().plusDays(15),
                "ATIVA",
                new BigDecimal("850.00"),
                cliente2,
                corretor2,
                seguroResidencial,
                null
        );
        BigDecimal valParcela2 = new BigDecimal("850.00").divide(BigDecimal.valueOf(10), 2, RoundingMode.HALF_UP);
        for (int i = 1; i <= 10; i++) {
            LocalDate venc = LocalDate.now().minusDays(350).plusMonths(i - 1);
            apolice2.addParcela(new ParcelaPagamento(null, valParcela2, venc, "PAGO", apolice2));
        }
        apoliceRepository.save(apolice2);

        // 7. Notificações de Alerta
        notificacaoAlertaRepository.save(new NotificacaoAlerta(
                null,
                "Apólice APO-2026-RES-002 de Mariana de Souza vence em 15 dias. Inicie o contato de renovação.",
                "PENDENTE",
                LocalDateTime.now().minusHours(3),
                userCorretor2
        ));

        notificacaoAlertaRepository.save(new NotificacaoAlerta(
                null,
                "Sistema inicializado com sucesso. Ambiente de homologação pronto.",
                "LIDA",
                LocalDateTime.now().minusDays(1),
                userAdmin
        ));

        // 8. Log de Auditoria
        auditoriaService.registrar(
                "Inicialização da base de dados e carga inicial de demonstração",
                "sistema",
                "127.0.0.1",
                userAdmin
        );
    }
}
