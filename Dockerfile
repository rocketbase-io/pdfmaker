FROM node

RUN apt-get update && apt-get install -y pdftk

# Create app directory
WORKDIR /usr/src/app

COPY . .

RUN rm -rf node_modules
RUN npm install
RUN npm build


ENV PORT 3000
ENV HOST=0.0.0.0

CMD [ "node", "./dist/server.js" ]

