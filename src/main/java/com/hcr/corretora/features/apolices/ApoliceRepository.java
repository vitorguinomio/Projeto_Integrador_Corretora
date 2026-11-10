package com.hcr.corretora.features.apolices;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApoliceRepository extends JpaRepository<Apolice, Long> {
    Optional<Apolice> findByNumeroApolice(String numeroApolice);
    boolean existsByNumeroApolice(String numeroApolice);

    List<Apolice> findByClienteId(Long clienteId);
    List<Apolice> findByCorretorId(Long corretorId);
    List<Apolice> findBySituacao(String situacao);

    List<Apolice> findByDataTerminoBetweenAndSituacao(LocalDate inicio, LocalDate fim, String situacao);

    long countBySituacao(String situacao);

    @Query("SELECT a FROM Apolice a WHERE " +
            "(:termo IS NULL OR LOWER(a.numeroApolice) LIKE LOWER(CONCAT('%', :termo, '%')) OR LOWER(a.cliente.nome) LIKE LOWER(CONCAT('%', :termo, '%'))) AND " +
            "(:situacao IS NULL OR a.situacao = :situacao) AND " +
            "(:clienteId IS NULL OR a.cliente.id = :clienteId) AND " +
            "(:corretorId IS NULL OR a.corretor.id = :corretorId)")
    List<Apolice> pesquisar(
            @Param("termo") String termo,
            @Param("situacao") String situacao,
            @Param("clienteId") Long clienteId,
            @Param("corretorId") Long corretorId
    );
}
