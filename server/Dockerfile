FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE ${SERVER_PORT:-5000}
CMD ["npm", "run", "dev"]
