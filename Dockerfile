# ---- Stage 1: Build ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time overrides (pass via --build-arg)
ARG API_URL=http://localhost:8080
ARG DEFAULT_LIBRARY=ADBEGT
ARG SESSION_TIMEOUT=86400000
ARG MAX_RETRIES=3
ARG RETRY_DELAY=1000
ARG SSE_TIMEOUT=300000
ARG MAX_ITERATIONS=7
ARG SEARCH_TOP_K=5
ARG MAX_UPLOAD_SIZE_MB=10
ARG MIN_REQUEST_INTERVAL_MS=1000

# Generate .env from build args
RUN printf "PRODUCTION=true\nAPI_URL=%s\nSESSION_TIMEOUT=%s\nMAX_RETRIES=%s\nRETRY_DELAY=%s\nSSE_TIMEOUT=%s\nDEFAULT_LIBRARY=%s\nMAX_ITERATIONS=%s\nSEARCH_TOP_K=%s\nMAX_UPLOAD_SIZE_MB=%s\nMIN_REQUEST_INTERVAL_MS=%s\n" \
  "$API_URL" "$SESSION_TIMEOUT" "$MAX_RETRIES" "$RETRY_DELAY" "$SSE_TIMEOUT" \
  "$DEFAULT_LIBRARY" "$MAX_ITERATIONS" "$SEARCH_TOP_K" "$MAX_UPLOAD_SIZE_MB" "$MIN_REQUEST_INTERVAL_MS" > .env

RUN npm run build:prod

# ---- Stage 2: Serve with nginx ----
FROM nginx:alpine

COPY --from=build /app/dist/bs-assistant-web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4200

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:4200/ || exit 1
