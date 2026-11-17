#!/usr/bin/env python3
"""
Gerador Automatizado de Capturas Anotadas para o Manual do Sistema HCR Corretora.

Utiliza Playwright (navegação SPA em 1920x1080) e Pillow (PIL) para:
1. Garantir que os contêineres Docker estejam ativos e acessíveis em http://localhost:8000
   (incluindo ponte TCP local automática 8000 -> 3000 caso o Docker exponha a porta 3000).
2. Simular o fluxo real do usuário (login JWT, cliques no menu lateral, abertura de modais).
3. Extrair as coordenadas reais (bounding_box) via DOM de cada botão/elemento alvo.
4. Aplicar o efeito de Lupa (Zoom Callout 2.2x com margem de respiro, sombra leve,
   borda vermelha #FF0000 de 3px e linha indicadora sólida #FF0000 de 3px).
5. Exportar as imagens finais como passo_01.png .. passo_18.png em docs/assets/manual/.
"""

from __future__ import annotations

import io
import math
import os
import select
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Optional, Tuple

from PIL import Image, ImageDraw, ImageFilter
from playwright.sync_api import Page, Locator, sync_playwright

# Diretórios base do projeto
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
OUTPUT_DIR = PROJECT_ROOT / "docs" / "assets" / "manual"

VIEWPORT_W = 1920
VIEWPORT_H = 1080
RED_HEX = "#FF0000"
RED_RGB = (255, 0, 0)
BORDER_WIDTH = 3
PADDING_PX = 18
ZOOM_FACTOR = 2.25


def is_port_open(host: str, port: int, timeout: float = 1.0) -> bool:
    """Verifica se uma porta TCP local está aceitando conexões."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def wait_http_ok(url: str, timeout_sec: int = 30) -> bool:
    """Aguarda até que a URL responda com HTTP 200..399."""
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=3) as resp:
                if 200 <= resp.status < 400:
                    return True
        except Exception:
            pass
        time.sleep(0.5)
    return False


class LocalPortBridge:
    """
    Ponte TCP leve em background para encaminhar localhost:8000 -> localhost:3000
    quando o contêiner Nginx do front-end está mapeado na porta 3000 pelo docker-compose.yml.
    Garante que o Playwright acesse estritamente http://localhost:8000 sem alterar zonas read-only.
    """

    def __init__(self, listen_port: int = 8000, target_port: int = 3000, host: str = "127.0.0.1"):
        self.listen_port = listen_port
        self.target_port = target_port
        self.host = host
        self._server_sock: Optional[socket.socket] = None
        self._running = False
        self._thread: Optional[threading.Thread] = None

    def start(self) -> None:
        if is_port_open(self.host, self.listen_port):
            return
        self._server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._server_sock.bind((self.host, self.listen_port))
        self._server_sock.listen(64)
        self._running = True
        self._thread = threading.Thread(target=self._accept_loop, daemon=True)
        self._thread.start()

    def _accept_loop(self) -> None:
        assert self._server_sock is not None
        while self._running:
            try:
                client_sock, _ = self._server_sock.accept()
                threading.Thread(
                    target=self._handle_client,
                    args=(client_sock,),
                    daemon=True,
                ).start()
            except OSError:
                break

    def _handle_client(self, client_sock: socket.socket) -> None:
        try:
            target_sock = socket.create_connection((self.host, self.target_port), timeout=5)
        except OSError:
            client_sock.close()
            return

        sockets = [client_sock, target_sock]
        try:
            while self._running:
                rlist, _, xlist = select.select(sockets, [], sockets, 10.0)
                if xlist or not rlist:
                    break
                for s in rlist:
                    data = s.recv(65536)
                    if not data:
                        return
                    other = target_sock if s is client_sock else client_sock
                    other.sendall(data)
        except OSError:
            pass
        finally:
            try:
                client_sock.close()
            except OSError:
                pass
            try:
                target_sock.close()
            except OSError:
                pass

    def stop(self) -> None:
        self._running = False
        if self._server_sock:
            try:
                self._server_sock.close()
            except OSError:
                pass


def ensure_containers_and_url() -> Tuple[str, Optional[LocalPortBridge]]:
    """
    Garante que os containers Docker estejam ativos e que http://localhost:8000 responda.
    """
    print("[1/3] Verificando contêineres Docker da aplicação HCR Corretora...")
    if not is_port_open("127.0.0.1", 8000) and not is_port_open("127.0.0.1", 3000):
        print("      Contêineres não detectados nas portas locais. Executando 'docker compose up -d'...")
        subprocess.run(
            ["docker", "compose", "up", "-d"],
            cwd=str(PROJECT_ROOT),
            check=True,
        )

    bridge: Optional[LocalPortBridge] = None
    if not is_port_open("127.0.0.1", 8000) and is_port_open("127.0.0.1", 3000):
        print("      Ativando ponte local http://localhost:8000 -> http://localhost:3000 (corretora-frontend)...")
        bridge = LocalPortBridge(listen_port=8000, target_port=3000)
        bridge.start()

    base_url = os.getenv("MANUAL_BASE_URL", "http://localhost:8000")
    if not wait_http_ok(base_url, timeout_sec=30):
        if wait_http_ok("http://localhost:3000", timeout_sec=10):
            base_url = "http://localhost:3000"
        else:
            raise RuntimeError(
                "Não foi possível acessar a aplicação em http://localhost:8000 nem em http://localhost:3000."
            )

    # Também garante que o backend Spring Boot responde
    wait_http_ok("http://localhost:8080/api/seguros", timeout_sec=20)
    print(f"      Aplicação pronta e acessível em: {base_url}")
    return base_url, bridge


def rect_Anchor_point(
    rect: Tuple[int, int, int, int], toward_center: Tuple[float, float]
) -> Tuple[int, int]:
    """
    Calcula o ponto exato na borda do retângulo (x1, y1, x2, y2) na direção de `toward_center`.
    """
    x1, y1, x2, y2 = rect
    cx = (x1 + x2) / 2.0
    cy = (y1 + y2) / 2.0
    tx, ty = toward_center
    dx = tx - cx
    dy = ty - cy

    if abs(dx) < 1e-5 and abs(dy) < 1e-5:
        return int(cx), int(y1)

    hw = max(1.0, (x2 - x1) / 2.0)
    hh = max(1.0, (y2 - y1) / 2.0)

    scale_x = hw / abs(dx) if abs(dx) > 1e-5 else float("inf")
    scale_y = hh / abs(dy) if abs(dy) > 1e-5 else float("inf")
    scale = min(scale_x, scale_y)

    bx = int(round(cx + dx * scale))
    by = int(round(cy + dy * scale))
    return bx, by


def rects_overlap(
    a: Tuple[int, int, int, int], b: Tuple[int, int, int, int], margin: int = 36
) -> bool:
    """Retorna True se os dois retângulos se sobrepõem considerando uma margem mínima."""
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    return not (
        (ax2 + margin) < bx1
        or (bx2 + margin) < ax1
        or (ay2 + margin) < by1
        or (by2 + margin) < ay1
    )


def choose_zoom_position(
    crop_box: Tuple[int, int, int, int],
    zoom_w: int,
    zoom_h: int,
    preferred: str = "auto",
) -> Tuple[int, int, int, int]:
    """
    Escolhe uma posição livre na tela (1920x1080) para posicionar a caixa da lupa
    sem sobrepor o botão original (`crop_box`).
    """
    cx1, cy1, cx2, cy2 = crop_box
    bcx = (cx1 + cx2) // 2
    bcy = (cy1 + cy2) // 2
    gap = 95

    candidates_by_name = {
        "bottom-left": (cx1 - zoom_w - gap, cy2 + gap // 2),
        "bottom-right": (cx2 + gap, cy2 + gap // 2),
        "bottom": (bcx - zoom_w // 2, cy2 + gap),
        "top-left": (cx1 - zoom_w - gap, cy1 - zoom_h - gap // 2),
        "top-right": (cx2 + gap, cy1 - zoom_h - gap // 2),
        "top": (bcx - zoom_w // 2, cy1 - zoom_h - gap),
        "left": (cx1 - zoom_w - gap, bcy - zoom_h // 2),
        "right": (cx2 + gap, bcy - zoom_h // 2),
    }

    order = [
        "bottom-left",
        "bottom",
        "left",
        "top-left",
        "bottom-right",
        "right",
        "top",
        "top-right",
    ]
    if preferred in candidates_by_name:
        order = [preferred] + [k for k in order if k != preferred]

    margin_screen = 32
    for name in order:
        zx1, zy1 = candidates_by_name[name]
        zx1 = max(margin_screen, min(VIEWPORT_W - zoom_w - margin_screen, zx1))
        zy1 = max(margin_screen, min(VIEWPORT_H - zoom_h - margin_screen, zy1))
        candidate = (zx1, zy1, zx1 + zoom_w, zy1 + zoom_h)
        if not rects_overlap(crop_box, candidate, margin=45):
            return candidate

    # Fallback seguro no quadrante oposto da tela
    zx1 = 320 if bcx > VIEWPORT_W // 2 else VIEWPORT_W - zoom_w - 80
    zy1 = 120 if bcy > VIEWPORT_H // 2 else VIEWPORT_H - zoom_h - 80
    return (zx1, zy1, zx1 + zoom_w, zy1 + zoom_h)


def annotate_with_zoom_callout(
    screenshot_bytes: bytes,
    bbox: dict,
    output_path: Path,
    preferred_pos: str = "auto",
    zoom_factor: float = ZOOM_FACTOR,
    padding: int = PADDING_PX,
) -> None:
    """
    Aplica o efeito de Lupa (Zoom Callout) e Linha Indicadora sobre a captura:
    1. Recorta a região do elemento alvo com margem de respiro (~18px).
    2. Amplia o recorte em ~2.25x (entre 2.0x e 2.5x).
    3. Adiciona sombra leve e borda vermelha (#FF0000, 3px) na caixa ampliada.
    4. Desenha borda de referência e linha vermelha sólida (#FF0000, 3px) conectando
       a borda do botão original até a borda da caixa com a lupa.
    """
    base_img = Image.open(io.BytesIO(screenshot_bytes)).convert("RGBA")
    w, h = base_img.size

    bx = float(bbox["x"])
    by = float(bbox["y"])
    bw = float(bbox["width"])
    bh = float(bbox["height"])

    cx1 = max(0, int(round(bx - padding)))
    cy1 = max(0, int(round(by - padding)))
    cx2 = min(w, int(round(bx + bw + padding)))
    cy2 = min(h, int(round(by + bh + padding)))
    crop_box = (cx1, cy1, cx2, cy2)

    # Recorta da imagem original antes de desenhar qualquer anotação
    cropped = base_img.crop(crop_box)
    cw, ch = cropped.size

    # Calcula dimensões ampliadas (2.0x a 2.5x), limitando caso o elemento seja muito largo
    effective_zoom = zoom_factor
    max_zoom_w = 640
    max_zoom_h = 360
    if cw * effective_zoom > max_zoom_w:
        effective_zoom = max(2.0, max_zoom_w / max(cw, 1))
    if ch * effective_zoom > max_zoom_h:
        effective_zoom = min(effective_zoom, max(2.0, max_zoom_h / max(ch, 1)))

    zoom_w = max(80, int(round(cw * effective_zoom)))
    zoom_h = max(50, int(round(ch * effective_zoom)))
    zoomed_crop = cropped.resize((zoom_w, zoom_h), Image.Resampling.LANCZOS)

    zoom_box = choose_zoom_position(crop_box, zoom_w, zoom_h, preferred=preferred_pos)
    zx1, zy1, zx2, zy2 = zoom_box

    # Camada de sombra leve para a caixa ampliada
    shadow_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    shadow_offset = 8
    shadow_draw.rectangle(
        [
            zx1 + shadow_offset - 2,
            zy1 + shadow_offset - 2,
            zx2 + shadow_offset + 2,
            zy2 + shadow_offset + 2,
        ],
        fill=(15, 23, 42, 115),
    )
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=10))
    annotated = Image.alpha_composite(base_img, shadow_layer)

    draw = ImageDraw.Draw(annotated)

    # Destaca também o contorno do botão original para ancorar visualmente a linha indicadora
    draw.rectangle([cx1, cy1, cx2, cy2], outline=RED_RGB + (255,), width=BORDER_WIDTH)

    # Calcula pontos de conexão entre a borda do botão original e a borda da lupa
    crop_center = ((cx1 + cx2) / 2.0, (cy1 + cy2) / 2.0)
    zoom_center = ((zx1 + zx2) / 2.0, (zy1 + zy2) / 2.0)
    start_pt = rect_Anchor_point(crop_box, zoom_center)
    end_pt = rect_Anchor_point(zoom_box, crop_center)

    # Linha indicadora vermelha sólida (#FF0000, 3px)
    draw.line([start_pt, end_pt], fill=RED_RGB + (255,), width=BORDER_WIDTH)

    # Pequeno ponto de ancoragem nas extremidades da linha para acabamento técnico limpo
    r_dot = 4
    for px, py in (start_pt, end_pt):
        draw.ellipse(
            [px - r_dot, py - r_dot, px + r_dot, py + r_dot],
            fill=RED_RGB + (255,),
        )

    # Cola o recorte ampliado na posição da lupa e desenha a borda vermelha (#FF0000, 3px)
    annotated.paste(zoomed_crop, (zx1, zy1))
    draw = ImageDraw.Draw(annotated)
    draw.rectangle(
        [zx1, zy1, zx2, zy2],
        outline=RED_RGB + (255,),
        width=BORDER_WIDTH,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    annotated.convert("RGB").save(output_path, format="PNG", optimize=True)


def capture_step(
    page: Page,
    step_num: int,
    description: str,
    target_locator: Locator,
    preferred_pos: str = "auto",
    zoom_factor: float = ZOOM_FACTOR,
) -> Path:
    """
    Aguarda a visibilidade e estabilidade do elemento alvo no DOM, extrai seu bounding_box
    exato, captura o screenshot em 1920x1080 e gera a imagem anotada passo_XX.png.
    """
    filename = f"passo_{step_num:02d}.png"
    out_path = OUTPUT_DIR / filename

    target_locator.first.wait_for(state="visible", timeout=15000)
    target_locator.first.scroll_into_view_if_needed(timeout=5000)
    # Aguarda animações CSS (animate-rise / transições de modal) estabilizarem
    page.wait_for_timeout(450)

    bbox = target_locator.first.bounding_box()
    if not bbox or bbox["width"] <= 0 or bbox["height"] <= 0:
        raise RuntimeError(f"Não foi possível obter bounding_box válido para o Passo {step_num:02d}: {description}")

    screenshot_bytes = page.screenshot(full_page=False, type="png")
    annotate_with_zoom_callout(
        screenshot_bytes=screenshot_bytes,
        bbox=bbox,
        output_path=out_path,
        preferred_pos=preferred_pos,
        zoom_factor=zoom_factor,
    )
    print(
        f"      [OK] {filename} -> {description} "
        f"(x={bbox['x']:.0f}, y={bbox['y']:.0f}, w={bbox['width']:.0f}, h={bbox['height']:.0f})"
    )
    return out_path


def click_sidebar_nav(page: Page, label: str) -> None:
    """Clica em um item do menu lateral da SPA e aguarda a estabilização dos dados."""
    nav_btn = page.locator("aside nav button", has_text=label).first
    nav_btn.wait_for(state="visible", timeout=10000)
    nav_btn.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)


def generate_all_manual_steps(base_url: str) -> None:
    """Executa todo o roteiro de navegação SPA e captura os 18 passos do manual."""
    print("[2/3] Iniciando navegador headless (Playwright Chromium 1920x1080)...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": VIEWPORT_W, "height": VIEWPORT_H},
            locale="pt-BR",
            device_scale_factor=1,
        )
        page = context.new_page()

        # ------------------------------------------------------------------
        # PASSO 01: Tela de Login e Autenticação JWT
        # ------------------------------------------------------------------
        page.goto(base_url, wait_until="networkidle")
        page.locator("input#email").wait_for(state="visible", timeout=15000)
        page.fill("input#email", "admin@hcr.com.br")
        page.fill("input#senha", "admin123")

        login_btn = page.get_by_role("button", name="Entrar no Sistema")
        capture_step(
            page=page,
            step_num=1,
            description="Tela de Login com credenciais preenchidas e botão 'Entrar no Sistema'",
            target_locator=login_btn,
            preferred_pos="top-left",
        )

        # Efetua login real na aplicação
        login_btn.click()
        page.wait_for_load_state("networkidle")
        page.locator("aside nav").wait_for(state="visible", timeout=15000)
        page.wait_for_timeout(600)

        # ------------------------------------------------------------------
        # PASSO 02: Painel Principal (Dashboard Operacional)
        # ------------------------------------------------------------------
        dashboard_cta = page.locator("main").get_by_role("button", name="Cadastrar cliente")
        capture_step(
            page=page,
            step_num=2,
            description="Painel Geral (Dashboard) com indicadores e atalho 'Cadastrar cliente'",
            target_locator=dashboard_cta,
            preferred_pos="bottom-left",
        )

        # ------------------------------------------------------------------
        # PASSO 03: Menu de Clientes e Listagem com Busca e Filtros
        # ------------------------------------------------------------------
        click_sidebar_nav(page, "Clientes")
        btn_novo_cliente = page.locator("main").get_by_role("button", name="Cadastrar cliente")
        capture_step(
            page=page,
            step_num=3,
            description="Módulo de Clientes com busca, filtros PF/PJ e botão 'Cadastrar cliente'",
            target_locator=btn_novo_cliente,
            preferred_pos="bottom-left",
        )

        # ------------------------------------------------------------------
        # PASSO 04: Modal de Cadastro de Novo Cliente
        # ------------------------------------------------------------------
        btn_novo_cliente.click()
        btn_salvar_cliente = page.get_by_role("button", name="Salvar cliente")
        btn_salvar_cliente.wait_for(state="visible", timeout=10000)
        capture_step(
            page=page,
            step_num=4,
            description="Modal 'Cadastrar cliente' com campos de identificação, contato e endereço",
            target_locator=btn_salvar_cliente,
            preferred_pos="top-left",
        )
        page.get_by_role("button", name="Cancelar", exact=True).click()
        page.wait_for_timeout(350)

        # ------------------------------------------------------------------
        # PASSO 05: Histórico Completo do Cliente (Dossiê 360°)
        # ------------------------------------------------------------------
        btn_ver_historico = page.locator("button[title='Ver histórico completo']").first
        btn_ver_historico.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)
        modal_fechar = page.locator("button[aria-label='Fechar modal']").first
        capture_step(
            page=page,
            step_num=5,
            description="Modal de Histórico Completo do Cliente (contatos, endereço, apólices e cotações)",
            target_locator=modal_fechar,
            preferred_pos="bottom-left",
            zoom_factor=2.4,
        )
        modal_fechar.click()
        page.wait_for_timeout(350)

        # ------------------------------------------------------------------
        # PASSO 06: Módulo de Apólices e Contratos
        # ------------------------------------------------------------------
        click_sidebar_nav(page, "Apólices")
        btn_registrar_apolice = page.locator("main").get_by_role("button", name="Registrar contratação")
        capture_step(
            page=page,
            step_num=6,
            description="Módulo de Apólices com filtros de vigência/situação e botão 'Registrar contratação'",
            target_locator=btn_registrar_apolice,
            preferred_pos="bottom-left",
        )

        # ------------------------------------------------------------------
        # PASSO 07: Modal de Registro de Contratação de Apólice
        # ------------------------------------------------------------------
        btn_registrar_apolice.click()
        btn_gerar_apolice = page.get_by_role("button", name="Gerar apólice")
        btn_gerar_apolice.wait_for(state="visible", timeout=10000)
        capture_step(
            page=page,
            step_num=7,
            description="Modal 'Registrar contratação' com vínculo de cliente, seguro, vigência e parcelamento",
            target_locator=btn_gerar_apolice,
            preferred_pos="top-left",
        )
        page.get_by_role("button", name="Cancelar", exact=True).click()
        page.wait_for_timeout(350)

        # ------------------------------------------------------------------
        # PASSO 08: Gestão de Parcelas e Baixa de Pagamentos
        # ------------------------------------------------------------------
        btn_ver_parcelas = page.locator("button", has_text="Ver parcelas").first
        btn_ver_parcelas.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)
        btn_marcar_pago = page.get_by_role("button", name="Marcar Pago").first
        capture_step(
            page=page,
            step_num=8,
            description="Modal de Parcelas da Apólice com resumo financeiro, forma de pagamento e botão 'Marcar Pago'",
            target_locator=btn_marcar_pago,
            preferred_pos="top-left",
        )
        page.get_by_role("button", name="Fechar tela de parcelas").click()
        page.wait_for_timeout(350)

        # ------------------------------------------------------------------
        # PASSO 09: Renovação Contratual de Apólice
        # ------------------------------------------------------------------
        btn_renovar = page.locator("button[title*='Renovar apólice']").first
        btn_renovar.click()
        btn_confirmar_renovacao = page.get_by_role("button", name="Confirmar renovação")
        btn_confirmar_renovacao.wait_for(state="visible", timeout=10000)
        capture_step(
            page=page,
            step_num=9,
            description="Modal 'Renovar apólice' mantendo automaticamente a data de início original do 1º contrato",
            target_locator=btn_confirmar_renovacao,
            preferred_pos="top-left",
        )
        page.get_by_role("button", name="Cancelar", exact=True).click()
        page.wait_for_timeout(350)

        # ------------------------------------------------------------------
        # PASSO 10: Módulo de Cotações e Propostas Comerciais
        # ------------------------------------------------------------------
        click_sidebar_nav(page, "Cotações e propostas")
        btn_nova_cotacao = page.locator("main").get_by_role("button", name="Nova cotação")
        capture_step(
            page=page,
            step_num=10,
            description="Módulo 'Cotações e propostas' com acompanhamento do funil de vendas e botão 'Nova cotação'",
            target_locator=btn_nova_cotacao,
            preferred_pos="bottom-left",
        )

        # ------------------------------------------------------------------
        # PASSO 11: Aceite de Proposta Comercial (Conversão Automática em Apólice)
        # ------------------------------------------------------------------
        btn_aceitar_proposta = page.get_by_role("button", name="Aceitar (Gera apólice)").first
        if btn_aceitar_proposta.count() > 0:
            target_step11 = btn_aceitar_proposta
            desc_step11 = "Ação 'Aceitar (Gera apólice)' em proposta comercial pendente"
        else:
            target_step11 = page.get_by_role("button", name="Elaborar proposta").first
            desc_step11 = "Ação 'Elaborar proposta' para cotação solicitada"

        capture_step(
            page=page,
            step_num=11,
            description=desc_step11,
            target_locator=target_step11,
            preferred_pos="top-left",
        )

        # ------------------------------------------------------------------
        # PASSO 12: Módulo de Alertas e Monitoramento de Vencimentos (30 dias)
        # ------------------------------------------------------------------
        click_sidebar_nav(page, "Alertas")
        btn_novo_alerta = page.locator("main").get_by_role("button", name="Novo alerta")
        capture_step(
            page=page,
            step_num=12,
            description="Módulo de Alertas com janela de vencimentos de 30 dias, avisos do banco e botão 'Novo alerta'",
            target_locator=btn_novo_alerta,
            preferred_pos="bottom-left",
        )

        # ------------------------------------------------------------------
        # PASSO 13: Catálogo de Seguros e Coberturas
        # ------------------------------------------------------------------
        click_sidebar_nav(page, "Seguros e coberturas")
        btn_novo_seguro = page.locator("main").get_by_role("button", name="Novo seguro")
        capture_step(
            page=page,
            step_num=13,
            description="Catálogo de Seguros e Coberturas com prêmios base, limites de indenização e botão 'Novo seguro'",
            target_locator=btn_novo_seguro,
            preferred_pos="bottom-left",
        )

        # ------------------------------------------------------------------
        # PASSO 14: Gestão de Corretores Autorizados (SUSEP)
        # ------------------------------------------------------------------
        click_sidebar_nav(page, "Corretores")
        btn_novo_corretor = page.locator("main").get_by_role("button", name="Novo corretor")
        capture_step(
            page=page,
            step_num=14,
            description="Módulo de Corretores com registro SUSEP, especialidades, carteira atendida e botão 'Novo corretor'",
            target_locator=btn_novo_corretor,
            preferred_pos="bottom-left",
        )

        # ------------------------------------------------------------------
        # PASSO 15: Gestão de Usuários, Status de Contas e Matriz de Permissões
        # ------------------------------------------------------------------
        click_sidebar_nav(page, "Usuários e permissões")
        btn_novo_usuario = page.locator("main").get_by_role("button", name="Novo usuário")
        capture_step(
            page=page,
            step_num=15,
            description="Módulo 'Usuários e permissões' com ativação/desativação de contas, Matriz RBAC e botão 'Novo usuário'",
            target_locator=btn_novo_usuario,
            preferred_pos="bottom-left",
        )

        # ------------------------------------------------------------------
        # PASSO 16: Relatórios Gerenciais e Exportação CSV
        # ------------------------------------------------------------------
        click_sidebar_nav(page, "Relatórios")
        btn_exportar_csv = page.locator("main").get_by_role("button", name="Exportar CSV")
        capture_step(
            page=page,
            step_num=16,
            description="Módulo de Relatórios Gerenciais consolidados com gráficos de carteira e botão 'Exportar CSV'",
            target_locator=btn_exportar_csv,
            preferred_pos="bottom-left",
        )

        # ------------------------------------------------------------------
        # PASSO 17: Trilha de Auditoria (Audit Trail)
        # ------------------------------------------------------------------
        click_sidebar_nav(page, "Auditoria")
        select_tabela_auditoria = page.locator("main select").first
        capture_step(
            page=page,
            step_num=17,
            description="Módulo de Auditoria (Audit Trail) com busca textual e seletor de filtro por tabela do PostgreSQL",
            target_locator=select_tabela_auditoria,
            preferred_pos="bottom-left",
        )

        # ------------------------------------------------------------------
        # PASSO 18: Alternância de Perfil de Visão e Logout Seguro
        # ------------------------------------------------------------------
        btn_logout = page.locator("aside button[aria-label='Sair']")
        capture_step(
            page=page,
            step_num=18,
            description="Rodapé da barra lateral com identificação do usuário logado e botão 'Sair' (Logout JWT)",
            target_locator=btn_logout,
            preferred_pos="top-right",
            zoom_factor=2.4,
        )

        browser.close()


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    bridge: Optional[LocalPortBridge] = None
    try:
        base_url, bridge = ensure_containers_and_url()
        generate_all_manual_steps(base_url)
        print(f"[3/3] Concluído! 18 imagens anotadas salvas em: {OUTPUT_DIR}")
        return 0
    finally:
        if bridge:
            bridge.stop()


if __name__ == "__main__":
    sys.exit(main())
