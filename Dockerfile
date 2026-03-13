FROM node:18-alpine

WORKDIR /app/server

COPY server/package*.json ./
RUN npm install

COPY server/ ./
COPY admin/ ../admin/
COPY *.html ../

EXPOSE 3000

CMD ["node", "server.js"]
