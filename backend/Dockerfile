# Multi-stage production Dockerfile for College ERP Backend
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Production Runtime Stage
FROM node:22-alpine

WORKDIR /usr/src/app

COPY --chown=node:node --from=builder /usr/src/app ./

# Ensure writeable directories for non-root execution
RUN mkdir -p uploads logs && chown -R node:node uploads logs

# Non-root unprivileged security execution
USER node

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

CMD ["node", "server.js"]
