#!/bin/bash
set -e
npx prisma generate
npx next build --webpack
echo "✅ Build complete"
