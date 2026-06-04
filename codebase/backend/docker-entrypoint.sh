#!/bin/sh
set -e

echo "→ Applying database schema..."
npx prisma db push --skip-generate

if [ "$RUN_SEED" = "true" ]; then
  echo "→ Seeding database..."
  npx ts-node prisma/seed.ts
fi

echo "→ Starting server..."
exec "$@"
