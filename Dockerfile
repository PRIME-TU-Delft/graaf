FROM node:22-alpine
WORKDIR /app

RUN corepack enable

COPY .gitignore package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .
RUN echo "$(date)" > /app/static/version.txt
RUN pnpm prisma generate
RUN pnpm build

CMD ["node", "build"]
