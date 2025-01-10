# Graaf

## Installation

Create an .env file in the root of the project with the following content:

```env
DATABASE_URL="postgres://root:mysecretpassword@localhost:5432/local"
```

```bash
# Terminal 1
podman compose up # Or docker compose up

# Terminal 2
pnpm install

pnpm prisma generate
pnpm prisma db push
```

## Usage

```bash
# Terminal 1 - if not already running
podman compose up # Or docker compose up

# Terminal 2
pnpm dev
```
