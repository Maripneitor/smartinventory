FROM node:20-alpine

WORKDIR /app

# Dependencias primero (mejor cache)
COPY package.json package-lock.json* ./
RUN npm install


# Código
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
