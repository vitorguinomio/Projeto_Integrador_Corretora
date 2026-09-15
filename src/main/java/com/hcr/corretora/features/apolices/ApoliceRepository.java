package com.hcr.corretora.features.apolices;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApoliceRepository extends JpaRepository<Apolice, Long> {

    Optional<Apolice> findByNumeroApolice(String numeroApolice);

    List<Apolice> findByClienteId(Long clienteId);
}
