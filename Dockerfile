FROM node:lts

RUN apt-get update && apt-get install -y pdftk

ADD . /app
WORKDIR /app

RUN rm -rf node_modules
RUN npm install
RUN npm build


ENV PORT 3000
ENV HOST=0.0.0.0

CMD [ "node", "./dist/server.js" ]

