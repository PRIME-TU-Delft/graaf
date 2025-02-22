# Graaf

## Preview

https://graaf.netlify.app

## Installation

Create an .env file in the root of the project with the following content:

```env
DATABASE_URL="postgres://root:mysecretpassword@localhost:5432/local"
```

```bash
# Terminal 1
podman compose up db # Or docker compose up db

# Terminal 2
pnpm install

pnpm prisma generate # will generate the prisma client
pnpm prisma db push # will setup the database schema
pnpm prisma db seed # will setup the database with some initial data
```

## Usage

```bash
# Terminal 1 - if not already running
podman compose up # Or docker compose up

# Terminal 2
pnpm dev
```

## Testing

```bash
pnpm test:integration
```
