# memelli-motion-render — universal shell + Blender for Lottie generation.
FROM debian:bookworm-slim
LABEL CACHE_BUST=1777872280303

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=20

RUN apt-get update && apt-get install -y --no-install-recommends     curl ca-certificates xz-utils     blender python3 python3-pip     libxi6 libxxf86vm1 libxfixes3 libxrender1 libgl1 libglu1-mesa     && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &&     apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

RUN blender --version

WORKDIR /app
COPY package.json ./
RUN npm install
COPY src ./src

EXPOSE 3000
CMD ["node", "src/index.js"]
