# Dockerfile para o servidor de sinalização

# Etapa 1: Construção
FROM node:20-alpine AS builder

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos necessários para dependências
COPY package.json pnpm-lock.yaml ./

# Instalar dependências usando pnpm
RUN pnpm install --frozen-lockfile

# Copiar o restante do código
COPY . .

# Etapa 2: Execução
FROM node:20-alpine

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Diretório de trabalho
WORKDIR /app

# Copiar apenas o código construído da etapa anterior
COPY --from=builder /app .

# Expor a porta do servidor
EXPOSE 3000

# Comando de entrada
CMD ["node", "server.js"]
