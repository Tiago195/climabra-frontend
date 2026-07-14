# Env do build EMPACOTADO (Capacitor) — usado por `bun run build:app` (vite --mode app).
# O bundle web normal (opi/workers) NÃO lê este arquivo e continua derivando a API pela URL.
#
# Por que é obrigatório: na WebView a origem é http://localhost, e a derivação por hostname
# apontaria a API para o localhost do CELULAR. Ver services/index.ts#resolveApiUrl.
#
# Endpoint de DEV/beta (opção (b) da Fase 0 do PLANO_APP_CAPACITOR.md): DuckDNS, IPv6-only + HTTP
# puro → o app SÓ alcança a API em redes com IPv6 (4G/5G) e depende de `cleartext: true`.
# Quando o domínio + Cloudflare Tunnel entrarem (Fase 0(a)), trocar por https://api.<dominio>
# e remover o cleartext do capacitor.config.ts + do AndroidManifest.
VITE_API_URL=http://dev-climabra.duckdns.org:8091

# Base do FRONT (nginx) — serve /app/version.json e /app/latest.apk do canal de atualização
# (scripts/publish-apk.sh). É outra porta que a API: 8090, não 8091. Sem esta env o banner de
# "nova versão" simplesmente não liga (o app continua funcionando).
VITE_APP_UPDATE_URL=http://dev-climabra.duckdns.org:8090
