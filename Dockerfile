# syntax=docker/dockerfile:1
FROM node:20.5.1-alpine
WORKDIR /campal/app
COPY package*.json ./
RUN npm i --omit=dev && npm i -g forever
RUN apk update && apk upgrade
RUN apk add --no-cache ffmpeg
COPY ./server ./server
EXPOSE 4000
CMD ["npm", "run", "normal"]