FROM node:22.3-bookworm-slim

WORKDIR /node
COPY . .

RUN yarn
RUN chmod +x /node/entrypoint.sh

ENTRYPOINT ["/bin/bash", "/node/entrypoint.sh"]
