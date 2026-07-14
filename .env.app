# Env do build EMPACOTADO (Capacitor) — usado por `bun run build:app` (vite --mode app).
# O bundle web normal (opi/workers) NÃO lê este arquivo e continua derivando a API pela URL.
#
# Por que é obrigatório: na WebView a origem é http://localhost, e a derivação por hostname
# apontaria a API para o localhost do CELULAR. Ver services/index.ts#resolveApiUrl.
#
# Domínio próprio + Cloudflare Tunnel (Fase 0(a) do PLANO_APP_CAPACITOR.md — feito).
# Saiu do DuckDNS (IPv6-only + HTTP puro, que só funcionava em rede com IPv6): agora é https
# e a mesma origem do site. O túnel expõe SÓ a porta do front, então a API vem pelo /api do
# nginx — não existe mais porta 8091 pública.
# Com https, o `cleartext: true` do capacitor.config.ts + AndroidManifest pode sair.
VITE_API_URL=https://climabra.com.br/api

# Base do FRONT (nginx) — serve /app/version.json e /app/latest.apk do canal de atualização
# (scripts/publish-apk.sh). Mesma origem, sem porta.
VITE_APP_UPDATE_URL=https://climabra.com.br
