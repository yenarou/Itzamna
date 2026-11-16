
# Etapa de construcción
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Astro genera archivos estáticos
ENV PUBLIC_API_URL=""
RUN npm run build

# Etapa de producción
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
