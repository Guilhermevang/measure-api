FROM node:latest as builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

FROM builder as development
ENV NODE_ENV=development

EXPOSE 8800

CMD ["npm", "run", "dev"]

FROM builder as production
ENV NODE_ENV=production

CMD ["npm", "start"]