#!/usr/bin/env python3
"""
Gerador do Manual em PDF (docs/MANUAL_DO_SISTEMA.pdf) a partir do arquivo
docs/MANUAL_DO_SISTEMA.md e das capturas anotadas em docs/assets/manual/.

Utiliza Python Markdown + Playwright Chromium Headless para renderizar um documento
PDF editorial com todas as 18 imagens embutidas em alta resolução, tabelas formatadas,
sumário navegável e cabeçalho/rodapé numerado.
"""

from __future__ import annotations

import base64
import re
import sys
from pathlib import Path
import markdown
from playwright.sync_api import sync_playwright

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
DOCS_DIR = PROJECT_ROOT / "docs"
MD_PATH = DOCS_DIR / "MANUAL_DO_SISTEMA.md"
PDF_PATH = DOCS_DIR / "MANUAL_DO_SISTEMA.pdf"


def embed_images_as_data_uri(md_text: str, base_dir: Path) -> str:
    """
    Substitui referências Markdown ![alt](./assets/manual/passo_XX.png) por tags <figure>
    com data URI Base64 para garantir carregamento 100% determinístico no PDF.
    """
    pattern = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")

    def replacer(match: re.Match) -> str:
        alt_text = match.group(1)
        rel_path = match.group(2).strip()
        img_path = (base_dir / rel_path).resolve()
        if not img_path.exists():
            return match.group(0)
        encoded = base64.b64encode(img_path.read_bytes()).decode("ascii")
        return (
            f'<figure class="step-figure">'
            f'<img src="data:image/png;base64,{encoded}" alt="{alt_text}" />'
            f'<figcaption>{alt_text} — Captura real anotada com efeito de lupa (#FF0000)</figcaption>'
            f"</figure>"
        )

    return pattern.sub(replacer, md_text)


def build_html_document(body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Manual Completo do Sistema — HCR Corretora de Seguros</title>
  <style>
    @page {{
      size: A4 portrait;
      margin: 18mm 15mm 18mm 15mm;
    }}

    * {{
      box-sizing: border-box;
    }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      line-height: 1.55;
      font-size: 10.5pt;
      margin: 0;
      padding: 0;
    }}

    .cover-banner {{
      background: linear-gradient(135deg, #0b2e2b 0%, #0f4c45 65%, #135e56 100%);
      color: #f9fafb;
      padding: 28px 32px;
      border-radius: 12px;
      margin-bottom: 22px;
      border-left: 6px solid #e08e26;
    }}

    .cover-banner .eyebrow {{
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 8.5pt;
      color: #f5b041;
      font-weight: 700;
      margin: 0 0 8px 0;
    }}

    .cover-banner h1 {{
      color: #ffffff;
      font-size: 21pt;
      line-height: 1.2;
      margin: 0 0 8px 0;
      border: none;
      padding: 0;
    }}

    .cover-banner p {{
      margin: 0;
      font-size: 10pt;
      color: #e5e7eb;
    }}

    h1 {{
      font-size: 18pt;
      color: #0b2e2b;
      border-bottom: 2px solid #0f4c45;
      padding-bottom: 6px;
      margin-top: 0;
      margin-bottom: 14px;
    }}

    h2 {{
      font-size: 14pt;
      color: #0b2e2b;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 5px;
      margin-top: 22px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }}

    h3 {{
      font-size: 12pt;
      color: #0f4c45;
      margin-top: 18px;
      margin-bottom: 8px;
      page-break-after: avoid;
      background: #f3f7f6;
      padding: 7px 12px;
      border-left: 4px solid #0f4c45;
      border-radius: 4px;
    }}

    p, li {{
      color: #1f2937;
    }}

    ul, ol {{
      margin-top: 6px;
      margin-bottom: 10px;
      padding-left: 22px;
    }}

    li {{
      margin-bottom: 4px;
    }}

    a {{
      color: #0f4c45;
      text-decoration: none;
    }}

    code {{
      font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
      font-size: 9pt;
      background: #f3f4f6;
      color: #b91c1c;
      padding: 1.5px 5px;
      border-radius: 4px;
    }}

    pre {{
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 14px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 8.8pt;
      page-break-inside: avoid;
    }}

    pre code {{
      background: transparent;
      color: inherit;
      padding: 0;
    }}

    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 18px 0;
      font-size: 9.2pt;
      page-break-inside: avoid;
    }}

    th {{
      background: #0b2e2b;
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #0b2e2b;
    }}

    td {{
      padding: 7px 10px;
      border: 1px solid #d1d5db;
      vertical-align: top;
    }}

    tr:nth-child(even) td {{
      background: #f9fafb;
    }}

    hr {{
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 18px 0;
    }}

    figure.step-figure {{
      margin: 12px 0 18px 0;
      padding: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }}

    figure.step-figure img {{
      width: 100%;
      max-height: 118mm;
      object-fit: contain;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      display: block;
      margin: 0 auto;
    }}

    figure.step-figure figcaption {{
      margin-top: 6px;
      font-size: 8.5pt;
      color: #475569;
      font-weight: 600;
    }}
  </style>
</head>
<body>
  <div class="cover-banner">
    <p class="eyebrow">HCR Corretora de Seguros · Brasília / DF · Documentação Oficial</p>
    <h1>Manual Completo do Sistema</h1>
    <p>Guia Operacional e Técnico com Capturas Reais Anotadas (React 18 + Spring Boot 3 + PostgreSQL 16)</p>
  </div>
  {body_html}
</body>
</html>
"""


def generate_pdf() -> int:
    if not MD_PATH.exists():
        raise FileNotFoundError(f"Arquivo Markdown não encontrado: {MD_PATH}")

    print(f"[1/3] Lendo {MD_PATH.relative_to(PROJECT_ROOT)} e embutindo as 18 capturas de docs/assets/manual/...")
    raw_md = MD_PATH.read_text(encoding="utf-8")

    # Remove o primeiro título H1 duplicado pois já consta no banner de capa
    raw_md_clean = re.sub(r"^#\s+Manual Completo do Sistema[^\n]*\n+", "", raw_md, count=1)
    md_with_images = embed_images_as_data_uri(raw_md_clean, DOCS_DIR)

    body_html = markdown.markdown(
        md_with_images,
        extensions=["tables", "fenced_code", "toc"],
    )
    full_html = build_html_document(body_html)

    print("[2/3] Renderizando PDF em alta definição via Playwright Chromium...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_content(full_html, wait_until="networkidle")
        page.pdf(
            path=str(PDF_PATH),
            format="A4",
            print_background=True,
            display_header_footer=True,
            header_template=(
                '<div style="width:100%; font-size:7.5pt; color:#64748b; '
                'padding:0 15mm; display:flex; justify-content:space-between; font-family:sans-serif;">'
                "<span>HCR Corretora de Seguros — Manual do Sistema</span>"
                "<span>Java 21 · Spring Boot 3 · React · PostgreSQL 16</span>"
                "</div>"
            ),
            footer_template=(
                '<div style="width:100%; font-size:7.5pt; color:#64748b; '
                'padding:0 15mm; display:flex; justify-content:space-between; font-family:sans-serif;">'
                "<span>Documento Gerado Automaticamente (Playwright + Pillow)</span>"
                '<span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>'
                "</div>"
            ),
            margin={
                "top": "18mm",
                "bottom": "18mm",
                "left": "14mm",
                "right": "14mm",
            },
        )
        browser.close()

    size_kb = PDF_PATH.stat().st_size / 1024.0
    print(f"[3/3] PDF gerado com sucesso: {PDF_PATH} ({size_kb:.1f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(generate_pdf())
