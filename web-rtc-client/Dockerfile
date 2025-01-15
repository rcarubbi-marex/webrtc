# Etapa 1: Construção
FROM node:20-alpine AS builder

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos necessários para dependências
COPY package.json pnpm-lock.yaml ./

# Instalar dependências sem cache local
RUN pnpm install --strict

# Copiar o restante do código para o contêiner
COPY . .


# Argumento para o VITE_SIGNALING_SERVER_URL
ARG SIGNALING_SERVER_URL

# Define a variável como ambiente
ENV VITE_SIGNALING_SERVER_URL=${SIGNALING_SERVER_URL}


# Construir o projeto com Vite
RUN pnpm run build

# Etapa 2: Servir os Arquivos
FROM nginx:alpine

# Diretório de trabalho do Nginx
WORKDIR /usr/share/nginx/html

# Limpar arquivos padrão do Nginx
RUN rm -rf ./*

# Copiar os arquivos construídos da etapa anterior
COPY --from=builder /app/dist .

# Configuração personalizada do Nginx (opcional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor a porta padrão do Nginx
EXPOSE 80

# Comando de entrada
CMD ["nginx", "-g", "daemon off;"]
