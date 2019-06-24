FROM node

RUN apt-get update && apt-get install -y pdftk

ADD . /app
WORKDIR /app

RUN rm -rf node_modules
RUN npm install


ENV PORT 3000
ENV HOST=0.0.0.0

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ./entrypoint.sh

