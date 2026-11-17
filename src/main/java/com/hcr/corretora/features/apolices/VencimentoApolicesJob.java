package com.hcr.corretora.features.apolices;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Atualiza a situação das apólices com vigência encerrada para VENCIDA (RF15). */
@Component
public class VencimentoApolicesJob {

    private static final Logger log = LoggerFactory.getLogger(VencimentoApolicesJob.class);

    private final ApoliceService apoliceService;

    public VencimentoApolicesJob(ApoliceService apoliceService) {
        this.apoliceService = apoliceService;
    }

    /** Ao subir a aplicação, corrige o que venceu enquanto ela estava parada. */
    @EventListener(ApplicationReadyEvent.class)
    public void aoIniciar() {
        executar();
    }

    /** Todos os dias às 00:05. */
    @Scheduled(cron = "0 5 0 * * *")
    public void executar() {
        int total = apoliceService.marcarApolicesVencidas();
        if (total > 0) {
            log.info("{} apólice(s) marcada(s) como VENCIDA", total);
        }
    }
}
