# Stage 1: Build TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Cài prod deps + ts-node (dùng cho db:seed)
COPY package*.json ./
RUN npm ci --omit=dev && npm install ts-node tslib

# Copy compiled output từ builder
COPY --from=builder /app/dist ./dist
# Copy Prisma generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy source cần cho seed + prisma cli
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
