package com.hcr.corretora.features.apolices;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParcelaPagamentoRepository extends JpaRepository<ParcelaPagamento, Long> {
    List<ParcelaPagamento> findByApoliceId(Long apoliceId);
    List<ParcelaPagamento> findByStatus(String status);
}
