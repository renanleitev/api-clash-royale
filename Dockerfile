# Usar uma imagem Node.js oficial
FROM node:20

# Definir o diretório de trabalho dentro do container
WORKDIR /app

# Copiar o package.json e o package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instalar as dependências da aplicação
RUN npm install --production

# Copiar o restante do código da aplicação para o diretório de trabalho
COPY . .

# Expor a porta que a aplicação vai usar
EXPOSE 3000

# Definir o comando para iniciar a aplicação
CMD ["npm", "start"]
