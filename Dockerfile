FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache curl \
  && addgroup -g 1000 nodejs \
  && adduser -u 1000 -G nodejs -s /bin/sh -D nodejs

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -sf http://localhost:3000/health || exit 1

ENV NODE_ENV=production \
    TRANSPORT=http \
    PORT=3000

CMD ["node", "--enable-source-maps", "dist/index.js"]
