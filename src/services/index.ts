import axios from "axios"
import { attachPaywall } from "./paywall"

// Base URL da API.
// Regra: o backend roda na MESMA máquina que serve o front, na porta 8080.
//  - aberto em localhost            → http://localhost:8080
//  - aberto na LAN (ex.: 192.168.x) → http://192.168.x:8080  (funciona de outros aparelhos)
//  - front publicado (*.workers.dev) → API na nuvem
//  - override explícito             → VITE_API_URL
const envUrl = import.meta.env.VITE_API_URL as string | undefined

function resolveApiUrl(): string {
  if (envUrl) return envUrl
  const host = window.location.hostname
  if (host.endsWith("workers.dev")) return "https://climabra-api.fly.dev"
  // localhost ou IP da LAN: a API está no mesmo host, porta 8080
  return `http://${host}:8080`
}

export const DEFAULT_URL = resolveApiUrl()

/**
 * Factory central das instâncias axios dos services (Fase 1 do refino de erros — KANBAN.md).
 * Antes cada service criava seu próprio `axios.create`; agora todos passam por aqui.
 *
 * IMPORTANTE: não normaliza nem transforma o formato do erro — os fluxos especiais (402 paywall,
 * 401 do portal, 429/cooldown do OTP) continuam recebendo o AxiosError original em seus próprios
 * handlers/interceptors. A normalização para exibição ao usuário é responsabilidade de
 * `getApiErrorMessage`/`getFieldErrors` (services/apiError.ts), chamados no ponto de uso (catch).
 *
 * `withPaywall`: mantém o precedente de paywall.ts — só os services que já anexavam
 * `attachPaywall` continuam anexando (ações sensíveis/escrita).
 */
export function createApi(path: string, opts?: { withPaywall?: boolean }) {
  const instance = axios.create({ baseURL: `${DEFAULT_URL}${path}` })
  if (opts?.withPaywall) attachPaywall(instance)
  return instance
}
