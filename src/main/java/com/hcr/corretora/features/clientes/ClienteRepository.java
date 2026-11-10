package com.hcr.corretora.features.clientes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByCpfCnpj(String cpfCnpj);
    boolean existsByCpfCnpj(String cpfCnpj);
    Optional<Cliente> findByEmail(String email);
    Optional<Cliente> findByUsuarioId(Long usuarioId);

    @Query("SELECT c FROM Cliente c WHERE LOWER(c.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR c.cpfCnpj LIKE CONCAT('%', :termo, '%') OR LOWER(c.email) LIKE LOWER(CONCAT('%', :termo, '%'))")
    List<Cliente> buscarPorTermo(@Param("termo") String termo);
}
