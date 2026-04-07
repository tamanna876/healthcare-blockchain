FROM node:18-alpine AS builder

WORKDIR /app/frontend

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app/frontend

# Install serve to run production build
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/frontend/dist ./dist

# Expose port
EXPOSE 5173

# Run application
CMD ["serve", "-s", "dist", "-l", "5173"]
