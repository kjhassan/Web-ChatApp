# ---------- Stage 1: Build Frontend ----------
FROM node:18-alpine AS builder
WORKDIR /app

# Install backend dependencies (needed for server.js only)
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Install & Build frontend
COPY frontend ./frontend
RUN cd frontend && npm ci && npm run build

# ---------- Stage 2: Create Final Runtime Image ----------
FROM node:18-alpine
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/. .

# Copy built frontend into backend/dist
COPY --from=builder /app/frontend/dist ./dist

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]






# FROM node:18-alpine

# WORKDIR /app


# COPY package*.json ./
# RUN npm install

# COPY . .

# EXPOSE 5000

# CMD ["npm", "start"]
