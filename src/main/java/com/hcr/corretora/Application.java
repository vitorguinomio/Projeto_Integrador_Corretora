package com.hcr.corretora;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        // "Hoje" segue o horário de Brasília (vencimentos, cancelamentos, alertas), mesmo que o
        // servidor/container esteja em UTC. Pode ser trocado pela variável de ambiente APP_TIMEZONE.
        String fuso = System.getenv().getOrDefault("APP_TIMEZONE", "America/Sao_Paulo");
        TimeZone.setDefault(TimeZone.getTimeZone(fuso));
        SpringApplication.run(Application.class, args);
    }
}
