# Gerador Automatizado de Capturas do Manual — HCR Corretora

Este utilitário em **Python (Playwright + Pillow)** captura as telas reais da aplicação React + Spring Boot em `1920x1080`, localiza as coordenadas exatas dos elementos no DOM (`bounding_box`) e aplica automaticamente o efeito de **Lupa (Zoom Callout)** com borda vermelha (`#FF0000`, `3px`) e linha indicadora sólida, exportando as imagens prontas em `docs/assets/manual/`.

---

## Pré-requisitos

1. **Docker e Docker Compose** ativos com os contêineres da aplicação em execução (`corretora-postgres`, `corretora-app` e `corretora-frontend`):
   ```bash
   docker compose up -d
   ```
   > **Nota:** Caso o front-end esteja exposto na porta `3000` (padrão do `docker-compose.yml`), o próprio script levanta automaticamente uma ponte local temporária em `http://localhost:8000` durante a captura.

2. **Python 3.10+** instalado no ambiente local.

---

## Configuração Inicial (Primeira Execução)

A partir da raiz do repositório:

```bash
cd tools/manual_generator
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/playwright install chromium
```

---

## Como Regerar as Imagens e o Manual em PDF

Sempre que houver alterações visuais no front-end React, execute a partir da **raiz do projeto**:

```bash
# 1. Regerar as 18 capturas anotadas (passo_01.png a passo_18.png)
./tools/manual_generator/.venv/bin/python tools/manual_generator/generate_manual_images.py

# 2. Compilar o Markdown + Imagens em PDF (docs/MANUAL_DO_SISTEMA.pdf)
./tools/manual_generator/.venv/bin/python tools/manual_generator/generate_manual_pdf.py
```

As 18 capturas anotadas (`passo_01.png` a `passo_18.png`) serão atualizadas automaticamente em `docs/assets/manual/`, prontas para visualização em `docs/MANUAL_DO_SISTEMA.md` e no documento consolidado `docs/MANUAL_DO_SISTEMA.pdf`.
