# syntax=docker/dockerfile:1

# ---------- 1) install dependencies (cached until package*.json changes) ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- 2) development: Vite dev server with hot reload (see compose.dev.yaml) ----------
FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ---------- 3) build the static site ----------
FROM deps AS build
COPY . .
# "/api" = same address as the site; nginx forwards it to the backend container.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- 4) production: nginx (non-root) serves the built files ----------
FROM nginxinc/nginx-unprivileged:stable-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:8080/healthz || exit 1
