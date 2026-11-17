package com.hcr.corretora.core.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Habilita as rotinas agendadas (ex.: vencimento automático de apólices). */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
