# Build Vite frontend, then serve via Express backend (Node 20)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/index.html ./index.html

EXPOSE 80

CMD ["node", "src/server/index.js"]
