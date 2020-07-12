FROM node:13.14-alpine

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers autoconf automake make nasm python git && \
  npm install --quiet node-gyp -gdoc

ENV export NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json ./
COPY .env.default .env

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]