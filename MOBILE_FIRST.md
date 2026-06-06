# Mobile-first — convenção do front

A maioria dos usuários (providers **e** clientes) usa o app no **celular**. Toda tela nova
nasce **mobile-first** e só então recebe ajustes para telas maiores.

Stack: **React + Vite + Tailwind v4** (config no CSS `src/index.css` via `@theme`, sem
`tailwind.config.js`). Breakpoints padrão: `sm` 640 / `md` 768 / `lg` 1024.

## Regras

1. **Base = mobile.** Escreva o estilo do celular sem prefixo e adicione `md:`/`lg:` só para
   telas maiores. Nunca o contrário (não use `md:` como base e "conserte" o mobile depois).
2. **Sem grid/largura fixa sem prefixo responsivo.** `grid-cols-1 sm:grid-cols-2` em vez de
   `grid-cols-2`; evite larguras fixas que estourem 360px.
3. **Nada de nav com scroll horizontal** (`overflow-x-auto` escondendo itens). Use drawer
   (`Sheet`), menu (`Select`) ou pills que quebram linha (`flex-wrap`).
4. **Alvo de toque ≥ 44px** em botões/links tocáveis.
5. **Modais → [`ResponsiveModal`](src/components/ui/responsive-modal.tsx)**: vira `Sheet`
   (bottom) no mobile e `Dialog` no desktop. Não use `Dialog` cru para fluxos do usuário.
6. **Altura → `100dvh`**, nunca `100vh` (barra do navegador mobile).
7. **Botões full-width no mobile** quando fizerem sentido (`w-full sm:w-auto`).
8. **Teste sempre a 360–390px** (iPhone SE / Android comum) e a 768px (tablet).

## Primitivos

- [`useIsMobile()`](src/hooks/useIsMobile.ts) — `true` em `< md` (768px); sobre
  [`useMediaQuery`](src/hooks/useMediaQuery.ts).
- [`ResponsiveModal`](src/components/ui/responsive-modal.tsx) — modal responsivo padrão.
- [`Sheet`](src/components/ui/sheet.tsx) — drawer (lados `left`/`right`/`top`/`bottom`).

## Validação

Subir o app com a skill `/run` e conferir em **360px, 390px e 768px** antes de dar a tela
por pronta. Sem scroll horizontal indevido, sem overflow, modais como Sheet no mobile.
