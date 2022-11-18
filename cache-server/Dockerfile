FROM node:16-alpine
RUN apk --no-cache add git curl

CMD ["npm", "start"]

WORKDIR /usr/src/app
ADD package.json .
RUN npm i --no-package-lock
WORKDIR /usr/src/app/node_modules/github-cache-server/

# docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' cache-server
