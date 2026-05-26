FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5005
CMD ["sh", "-c", "npm run build && npm run start"]
