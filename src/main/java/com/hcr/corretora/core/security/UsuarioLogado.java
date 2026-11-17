package com.hcr.corretora.core.security;

import com.hcr.corretora.features.clientes.ClienteRepository;
import com.hcr.corretora.features.corretores.CorretorRepository;
import com.hcr.corretora.features.usuarios.Usuario;
import com.hcr.corretora.features.usuarios.UsuarioRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * Identifica o usuário autenticado na requisição atual e aplica as regras de
 * "dados próprios": um CLIENTE só pode consultar e operar sobre os registros
 * vinculados ao seu próprio cadastro. Administradores e corretores não sofrem
 * essa restrição (as permissões por rota ficam no SecurityConfig).
 */
@Component
public class UsuarioLogado {

    public static final String ADMINISTRADOR = "ADMINISTRADOR";
    public static final String CORRETOR = "CORRETOR";
    public static final String CLIENTE = "CLIENTE";

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final CorretorRepository corretorRepository;

    public UsuarioLogado(UsuarioRepository usuarioRepository, ClienteRepository clienteRepository,
                         CorretorRepository corretorRepository) {
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.corretorRepository = corretorRepository;
    }

    private Authentication autenticacao() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("Usuário não autenticado.");
        }
        return auth;
    }

    public boolean possuiPerfil(String perfil) {
        return autenticacao().getAuthorities().stream()
                .anyMatch(a -> ("ROLE_" + perfil).equals(a.getAuthority()));
    }

    public boolean isCliente() {
        return possuiPerfil(CLIENTE);
    }

    public boolean isAdministrador() {
        return possuiPerfil(ADMINISTRADOR);
    }

    public Usuario usuario() {
        String email = autenticacao().getName();
        return usuarioRepository.findByLoginEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Usuário não encontrado."));
    }

    /** Id do cadastro de cliente do usuário logado (somente para o perfil CLIENTE). */
    public Long clienteId() {
        return clienteRepository.findByUsuarioId(usuario().getId())
                .map(c -> c.getId())
                .orElseThrow(() -> new AccessDeniedException("Usuário sem cadastro de cliente vinculado."));
    }

    /** Id do cadastro de corretor do usuário logado (ou null se não houver). */
    public Long corretorId() {
        return corretorRepository.findByUsuarioId(usuario().getId()).map(c -> c.getId()).orElse(null);
    }

    /** Para o perfil CLIENTE, retorna o próprio id; para os demais perfis, mantém o filtro informado. */
    public Long restringirClienteId(Long clienteIdInformado) {
        return isCliente() ? clienteId() : clienteIdInformado;
    }

    /** Bloqueia o acesso de um CLIENTE a registros de outro cliente. */
    public void exigirAcessoAoCliente(Long clienteIdDoRegistro) {
        if (isCliente() && !Objects.equals(clienteId(), clienteIdDoRegistro)) {
            throw new AccessDeniedException("Você não tem permissão para acessar dados de outro cliente.");
        }
    }

    /** Bloqueia o acesso a notificações de outro usuário (exceto para administradores). */
    public void exigirAcessoAoUsuario(Long usuarioIdDoRegistro) {
        if (!isAdministrador() && !Objects.equals(usuario().getId(), usuarioIdDoRegistro)) {
            throw new AccessDeniedException("Você não tem permissão para acessar este registro.");
        }
    }
}
