#!/bin/bash
cd /home/z/my-project
if [ ! -d ".next/standalone" ]; then
  echo "Building..."
  npx next build
  cp -r .next/static .next/standalone/.next/
  cp -r public .next/standalone/
fi
cd .next/standalone
export NODE_ENV=production
exec node server.js -H 0.0.0.0 -p 3000
