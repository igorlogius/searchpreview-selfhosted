FROM node:16-slim

RUN apt-get update \
    && apt-get install -y chromium  \
    && apt-get clean 

RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads

WORKDIR /home/pptruser

COPY package.json ./
COPY main.js ./

RUN chown -R pptruser:pptruser /home/pptruser

USER pptruser

RUN npm install

EXPOSE 7050

CMD [ "npm", "start" ]

