# ============================================================
#  Imagem do frontend: builda o SPA e serve via nginx.
#  Auto-contida — não depende de bind mount / arquivos no host.
#  Usada pela instância sandbox (docker-compose.opi.yml).
# ============================================================

# ---------- build ----------
FROM oven/bun:1 AS build
WORKDIR /app

# deps primeiro (cache): só refaz quando package.json/bun.lock mudam
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# código + build. VITE_API_URL=/api → API na mesma origem (proxy do nginx), sem CORS.
COPY . .
ENV VITE_API_URL=/api
RUN bun run build

# ---------- runtime ----------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
