# Imagem base Node.js
FROM node:18-alpine
# Atualizar pacotes do sistema (corrige CVEs do OpenSSL)
RUN apk upgrade --no-cache
# Definir diretório de trabalho
WORKDIR /app
# Copiar package.json e package-lock.json
COPY package*.json ./
# Instalar dependências
RUN npm install
# Copiar código da aplicação
COPY . .
# Expor porta
EXPOSE 3000
# Comando para rodar em modo desenvolvimento
CMD ["npm", "start"]
