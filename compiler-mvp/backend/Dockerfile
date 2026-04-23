FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
