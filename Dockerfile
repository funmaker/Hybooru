FROM node:latest
ENV DOCKERIZED=1

EXPOSE 80

WORKDIR /build
COPY . .
RUN npm install
RUN npm run build:prod
RUN mv dist /app
RUN npm prune --production
RUN mv node_modules /app

WORKDIR /app
RUN rm -rf /build

CMD npm start