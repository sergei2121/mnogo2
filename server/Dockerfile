FROM node:20-alpine

WORKDIR /app

# Install dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --production

COPY src ./src

# Create data directory
RUN mkdir -p /data

EXPOSE 3001

CMD ["node", "src/index.js"]
