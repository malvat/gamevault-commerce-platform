FROM node:24-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm ci
RUN npm --prefix client ci
RUN npm --prefix server ci

FROM deps AS build
COPY client ./client
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

RUN apk add --no-cache tzdata

COPY server/package*.json ./server/
RUN npm --prefix server ci --omit=dev

COPY server ./server
COPY docker ./docker
COPY --from=build /app/client/dist ./client/dist

EXPOSE 5000
CMD ["npm", "--prefix", "server", "start"]
