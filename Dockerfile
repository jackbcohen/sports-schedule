FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server.js .
ENV NODE_ENV=production
EXPOSE 6597
CMD ["node", "server.js"]
