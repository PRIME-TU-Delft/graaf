FROM node:22-alpine
WORKDIR /app

RUN npm i -g corepack@latest
RUN corepack enable

COPY .gitignore package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .
RUN date > /app/static/version.txt
RUN pnpm prisma generate
RUN pnpm build

CMD ["sh", "-c", "pnpm prisma migrate deploy & node build"]
