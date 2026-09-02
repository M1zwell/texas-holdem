FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/platform /app/platform
COPY --from=build /app/src /app/src
COPY --from=build /app/package.json /app/package.json
ENV WEB_DIST=/app/platform/web/dist
EXPOSE 8080
CMD ["npx", "tsx", "platform/server/index.ts"]
