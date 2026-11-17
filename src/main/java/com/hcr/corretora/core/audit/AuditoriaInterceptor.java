package com.hcr.corretora.core.audit;

import com.hcr.corretora.features.auditoria.AuditoriaService;
import com.hcr.corretora.features.usuarios.Usuario;
import com.hcr.corretora.features.usuarios.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;
import java.util.Set;

/**
 * Registra na trilha de auditoria (log_auditoria) toda operação de escrita concluída
 * com sucesso: quem fez, quando, de qual IP, em qual tabela e o quê (RNF22).
 * Fica centralizado aqui para que nenhuma funcionalidade nova "esqueça" de auditar.
 */
@Component
public class AuditoriaInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(AuditoriaInterceptor.class);

    private static final Set<String> METODOS_DE_ESCRITA = Set.of("POST", "PUT", "PATCH", "DELETE");

    /** recurso da URL -> { nome no texto, tabela afetada } */
    private static final Map<String, String[]> RECURSOS = Map.ofEntries(
            Map.entry("clientes", new String[]{"cliente", "cliente"}),
            Map.entry("corretores", new String[]{"corretor", "corretor"}),
            Map.entry("seguros", new String[]{"seguro", "seguro"}),
            Map.entry("apolices", new String[]{"apólice", "apolice"}),
            Map.entry("cotacoes", new String[]{"cotação", "cotacao"}),
            Map.entry("propostas", new String[]{"proposta", "proposta"}),
            Map.entry("usuarios", new String[]{"usuário", "usuario"}),
            Map.entry("administradores", new String[]{"administrador", "administrador"}),
            Map.entry("alertas", new String[]{"notificação", "notificacao_alerta"}),
            Map.entry("auth", new String[]{"usuário", "usuario"})
    );

    private final AuditoriaService auditoriaService;
    private final UsuarioRepository usuarioRepository;

    public AuditoriaInterceptor(AuditoriaService auditoriaService, UsuarioRepository usuarioRepository) {
        this.auditoriaService = auditoriaService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        String metodo = request.getMethod();
        int status = response.getStatus();
        String caminho = request.getRequestURI();

        // Só operações de escrita bem-sucedidas; login não altera dados
        if (!METODOS_DE_ESCRITA.contains(metodo) || status < 200 || status >= 300 || ex != null
                || caminho.startsWith("/auth/login")) {
            return;
        }

        try {
            String[] partes = caminho.replaceFirst("^/", "").split("/");
            String[] recurso = RECURSOS.getOrDefault(partes[0], new String[]{partes[0], partes[0]});
            String acao = descrever(metodo, partes, recurso[0], request);

            auditoriaService.registrar(limitar(acao, 255), recurso[1], ipDeOrigem(request), usuarioLogado());
        } catch (Exception e) {
            // A auditoria nunca deve derrubar a operação principal, que já foi concluída
            log.warn("Não foi possível registrar a auditoria de {} {}: {}", metodo, caminho, e.getMessage());
        }
    }

    private String descrever(String metodo, String[] partes, String nome, HttpServletRequest request) {
        @SuppressWarnings("unchecked")
        Map<String, String> vars = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        String id = vars == null ? null : vars.values().stream().findFirst().orElse(null);
        String alvo = id != null ? nome + " #" + id : nome;
        String ultimo = partes[partes.length - 1];

        if ("auth".equals(partes[0]) && "register".equals(ultimo)) return "Autocadastro de cliente";
        if ("apolices".equals(partes[0]) && partes.length > 1 && "parcelas".equals(partes[1])) {
            return "Atualização de status da parcela #" + id;
        }
        switch (ultimo) {
            case "cancelar": return "Cancelamento de " + alvo;
            case "renovar": return "Renovação de " + alvo;
            case "aceitar": return "Aceite de " + alvo;
            case "recusar": return "Recusa de " + alvo;
            case "status": return "Alteração de status de " + alvo;
            case "perfil": return "Alteração de perfil de " + alvo;
            case "situacao": return "Alteração de situação de " + alvo;
            case "ler": return "Leitura de " + alvo;
            case "coberturas": return "Inclusão de cobertura no " + alvo;
            default: break;
        }
        if (partes.length > 1 && "coberturas".equals(partes[1])) {
            return "Exclusão da cobertura #" + id;
        }
        return switch (metodo) {
            case "POST" -> "Cadastro de " + nome;
            case "PUT", "PATCH" -> "Alteração de " + alvo;
            case "DELETE" -> "Exclusão de " + alvo;
            default -> metodo + " " + String.join("/", partes);
        };
    }

    private Usuario usuarioLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return null;
        }
        return usuarioRepository.findByLoginEmail(auth.getName()).orElse(null);
    }

    /** O frontend fala com a API através do nginx, que repassa o IP real do usuário. */
    private String ipDeOrigem(HttpServletRequest request) {
        String encaminhado = request.getHeader("X-Forwarded-For");
        String ip = (encaminhado != null && !encaminhado.isBlank()) ? encaminhado.split(",")[0].trim() : request.getRemoteAddr();
        return limitar(ip, 45);
    }

    private static String limitar(String texto, int max) {
        return texto == null || texto.length() <= max ? texto : texto.substring(0, max);
    }
}
