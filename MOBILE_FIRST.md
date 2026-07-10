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

## Erros de request

O backend devolve `ErrorResponseDTO { message, status, fields? }` (ver
`api/.../ControllerAdvice.java`) — `message` já vem pronto em pt-BR (`ServiceException`) e
422 de validação traz `fields` (campo → mensagem).

- **Nunca** cravar string de erro de request num `toast.error("...")` nem usar
  `err.message`/`err.response.data.error` direto (o primeiro é o texto genérico do axios tipo
  "Request failed with status code 400"; o segundo é campo errado). Sempre:
  ```ts
  import { getApiErrorMessage, getFieldErrors } from "@/services/apiError"

  try {
    await algumService.fazerAlgo(...)
  } catch (err) {
    toast.error(getApiErrorMessage(err, "Erro ao salvar anotação")) // "Erro ao salvar anotação: <msg do backend>"
  }
  ```
  Sem `contextPrefix`, cai na mensagem do backend (ou genérica). Offline → "Sem conexão…"; 5xx →
  "Erro no servidor…"; 4xx → `message` do backend.
- **422 com `fields`** (forms com validação por campo — Login/Register, ClientForm/
  CreateClientDialog, AddCardDialog, ChargesCard, AddExceptionDialog etc.): use
  `getFieldErrors(err)` e mostre cada mensagem sob o input com
  [`FieldError`](src/components/ui/field-error.tsx) + `aria-invalid` no `Input`/`Textarea`; só
  cai no `toast.error` genérico quando **não** há `fields`. Nunca duplique num toast quando já
  mostrou por campo.
- `toast.error("...")` com string fixa continua OK para validação **local** de UI (ex.: "Escreva
  algo antes de salvar", "Selecione ao menos um turno") — isso não é erro de request.
- Todos os services em `src/services/*.ts` criam sua instância axios via `createApi(path, opts)`
  (`src/services/index.ts`) — não use `axios.create` direto num service novo. `opts.withPaywall`
  replica o comportamento de `attachPaywall` (402) já usado por `client`/`report`/`appointment`/
  `availability`.
