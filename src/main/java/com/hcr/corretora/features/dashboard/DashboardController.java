package com.hcr.corretora.features.dashboard;

import com.hcr.corretora.features.dashboard.dto.DashboardResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping({"", "/stats"})
    public ResponseEntity<DashboardResponse> obterMetricas() {
        return ResponseEntity.ok(dashboardService.obterMetricasGerais());
    }
}
