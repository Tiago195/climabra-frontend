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
