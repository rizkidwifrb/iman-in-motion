FROM node:20-bookworm-slim AS node-base

WORKDIR /app

ENV NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_PROGRESS=false \
    NPM_CONFIG_LOGLEVEL=warn \
    NODE_OPTIONS=--max-old-space-size=4096

COPY package.json package-lock.json* ./
RUN npm ci --include=dev --no-audit --no-fund --legacy-peer-deps

COPY . .

FROM node-base AS build
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM node-base AS api
ENV NODE_ENV=production \
    PORT=8080 \
    IIM_SERVICE_NAME=api
EXPOSE 8080
CMD ["node", "app.js"]

FROM node-base AS recommendation-engine
ENV NODE_ENV=production \
    PORT=8081 \
    IIM_SERVICE_NAME=recommendation-engine
EXPOSE 8081
CMD ["node", "backend/services/recommendation-engine.js"]

FROM node-base AS rag-service
ENV NODE_ENV=production \
    PORT=8082 \
    IIM_SERVICE_NAME=rag-service
EXPOSE 8082
CMD ["node", "backend/services/rag-service.js"]

FROM node-base AS scheduler
ENV NODE_ENV=production \
    PORT=8083 \
    IIM_SERVICE_NAME=scheduler
EXPOSE 8083
CMD ["node", "backend/services/scheduler.js"]

FROM nginx:1.27-alpine AS frontend
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
