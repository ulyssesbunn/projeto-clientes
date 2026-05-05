# Imagem base Node.js
FROM node:18-alpine
ARG REACT_APP_K8S_ENABLED=false
ENV REACT_APP_K8S_ENABLED=$REACT_APP_K8S_ENABLED
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
