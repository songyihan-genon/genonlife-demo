FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies in a separate layer
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Build the Next.js app
FROM base AS builder
WORKDIR /app
ENV NODE_ENV=production

# Build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_RESEARCH_API_BASE_URL
ENV NEXT_PUBLIC_RESEARCH_API_BASE_URL=${NEXT_PUBLIC_RESEARCH_API_BASE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only the necessary build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 5054

CMD ["sh", "-c", "node node_modules/next/dist/bin/next start -p 5054 -H 0.0.0.0"]
