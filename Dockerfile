FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm install

COPY . .

EXPOSE 3000

CMD cd server && node server.js
