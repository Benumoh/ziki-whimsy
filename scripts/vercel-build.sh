#!/bin/sh
# Issue-garden demo deploy: migrate, seed the demo data (first build only) and
# the garden showcase over Neon's direct connection, then build the app.
set -e
DB_DIRECT="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
prisma generate
DATABASE_URL="$DB_DIRECT" prisma migrate deploy
DATABASE_URL="$DB_DIRECT" prisma db seed
DATABASE_URL="$DB_DIRECT" tsx prisma/seed-garden.ts
next build --webpack
