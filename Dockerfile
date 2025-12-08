# Multi-stage build: build Vite frontend, then serve via Express backend
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine AS prod
WORKDIR /app

ENV NODE_ENV=production

ARG PORT=80
ENV PORT=${PORT}

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/index.html ./index.html

EXPOSE ${PORT}

CMD ["node", "src/server/index.js"]
