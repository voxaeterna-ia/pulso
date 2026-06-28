# Logos de Mercado Token

Colocar los archivos de imagen en esta carpeta con exactamente estos nombres:

## Logo principal (marca / plataforma)
- Archivo: `mercado-token-logo.png`
- Uso: navbar, footer, hero, pantalla de inicio, login, documentación, sección institucional
- NO usar para balances, wallets ni transacciones de token

## Logo token MKT (moneda / activo digital)
- Archivo: `mkt-token-logo.png`
- Uso: balance del usuario, wallet, pagos con MKT, rewards, staking, gráficos del token
- NO usar como logo principal de la empresa

## Jerarquía visual
- MERCADO TOKEN = plataforma / empresa / marketplace → siempre prioritario
- MKT = moneda / token / activo digital del ecosistema → solo en contexto financiero/token

## Tamaños disponibles (clases CSS)
- `size-sm`  → 32px de alto
- `size-md`  → 48px de alto
- `size-lg`  → 64px de alto
- `size-xl`  → 96px de alto

## Uso en HTML
```html
<!-- Logo marca (brand) -->
<img src="public/assets/logos/mercado-token-logo.png" alt="Mercado Token" class="logo-img size-md" />

<!-- Logo token MKT -->
<img src="public/assets/logos/mkt-token-logo.png" alt="MKT Token" class="logo-img size-sm" />
```
