# syntax=docker/dockerfile:1

# ---------- 1) production dependencies only ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------- 2) development image (nodemon + all dev dependencies) ----------
# Used by compose.dev.yaml; the source code is bind-mounted over /app.
FROM node:22-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 5000
CMD ["sh", "docker-entrypoint.sh"]

# ---------- 3) small, non-root production image ----------
FROM node:22-alpine AS production
ENV NODE_ENV=production \
    PORT=5000
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
# Uploaded images live here. compose mounts a named volume on this folder so they survive rebuilds.
RUN mkdir -p /app/uploads/recipes && chown -R node:node /app/uploads
USER node
EXPOSE 5000
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
