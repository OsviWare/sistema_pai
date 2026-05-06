# Next.js 16 — Node >= 18.18 (typescript-eslint / toolchain) o 20 LTS recomendado.
# Convención: volumen en compose + `npm run dev -- --turbopack`.

FROM node:20-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=development

WORKDIR /app

# Dependencias nativas mínimas para watchdog / compilación
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Primero manifest (añade package-lock.json en el repo cuando exista para usar npm ci)
COPY package.json package-lock.json ./

RUN npm ci
COPY . .

EXPOSE 3000

# Turbopack en modo desarrollo (hot-reload gestionado por volumenes en docker-compose)
CMD ["npm", "run", "dev", "--", "--turbopack", "-H", "0.0.0.0", "-p", "3000"]
