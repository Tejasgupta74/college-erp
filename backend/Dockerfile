# Multi-stage production Dockerfile for College ERP Backend
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Production Runtime Stage
FROM node:22-alpine

WORKDIR /usr/src/app

# Non-root unprivileged security execution
USER node

COPY --chown=node:node --from=builder /usr/src/app ./

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
