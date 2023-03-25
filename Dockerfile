FROM node:19.8.1-alpine AS builder

WORKDIR /build
COPY . .

RUN apk add --update --no-cache python3 make g++ && \
    rm -rf /var/cache/apk/*

RUN npm install && \
    npm run build:prod && \
    mv dist /app && \
    npm prune --production && \
    mv node_modules /app


FROM node:19.8.1-alpine

ENV DOCKERIZED=1

WORKDIR /app

COPY --from=builder /app .

EXPOSE 80
CMD ["npm", "start"]
