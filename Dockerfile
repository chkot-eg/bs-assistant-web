# ---- Stage 1: Build ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Use empty apiUrl so nginx handles the /api proxy
RUN sed -i "s|apiUrl: 'http://localhost:8080'|apiUrl: ''|" src/environments/environment.prod.ts

RUN npm run build:prod

# ---- Stage 2: Serve with nginx ----
FROM nginx:alpine

COPY --from=build /app/dist/bs-assistant-web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4200

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:4200/ || exit 1
