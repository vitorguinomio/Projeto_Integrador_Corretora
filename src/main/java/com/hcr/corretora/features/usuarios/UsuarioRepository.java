package com.hcr.corretora.features.usuarios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByLoginEmail(String loginEmail);
    boolean existsByLoginEmail(String loginEmail);
}
