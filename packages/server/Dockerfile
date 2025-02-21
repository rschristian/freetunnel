FROM node:22-alpine
WORKDIR /app
COPY . /app
RUN npm install --omit=dev && npm cache clean --force
EXPOSE 5000
CMD ["node", "./server.js"]
