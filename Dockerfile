FROM node:latest

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Copy all local files into the image.
COPY . .

RUN npm run build

###
# Only copy over the Node pieces we need
# ~> Saves  35MB
###
FROM node:latest
ENV TZ=America/Los_Angeles
WORKDIR /app
COPY --from=0 /app .
COPY . .

EXPOSE 3000
CMD ["node", "./build"]