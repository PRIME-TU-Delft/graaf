#!/usr/bin/env bash
# scripts/setup.sh

pnpm prisma generate
pnpm prisma db push --accept-data-loss --force-reset
pnpm prisma db seed