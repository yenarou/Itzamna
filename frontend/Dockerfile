
# Etapa 1: Compilación de Astro
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV PUBLIC_API_URL=""

RUN npm run build


# Etapa 2: Servidor de producción
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf.template /etc/nginx/templates/default.conf.template

ENV NGINX_ENVSUBST_FILTER="^(PORT|BACKEND_URL)$"

EXPOSE 8080
