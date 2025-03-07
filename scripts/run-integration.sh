#!/usr/bin/env bash
# scripts/run-integration.sh

DIR="$(cd "$(dirname "$0")" && pwd)"
source $DIR/setenv.sh

echo "Running integration tests..."

# Ensure podman is available
if ! command -v podman &> /dev/null
then
  echo "podman could not be found, please install it."
  exit
fi

podman compose up db-test -d

echo '🟡 - Waiting for database to be ready...'
$DIR/wait-for-it.sh "${DATABASE_URL}" 60

# Ensure pnpm is available
if ! command -v pnpm &> /dev/null
then
  echo "pnpm could not be found, please install it."
  exit
fi

pnpm prisma generate
pnpm prisma db push

if [ "$#" -eq  "0" ]
  then
  npx vitest -c ./vitest.config.integration.ts
else
  npx vitest -c ./vitest.config.integration.ts --ui
fi