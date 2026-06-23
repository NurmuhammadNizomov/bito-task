FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE ${CLIENT_PORT:-5173}
CMD ["npm", "run", "dev"]
