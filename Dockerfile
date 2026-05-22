FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=development
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_PROGRESS=false
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NODE_OPTIONS=--max-old-space-size=4096

COPY package.json package-lock.json* ./

RUN npm install --include=dev --no-audit --no-fund --legacy-peer-deps

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]