#!/bin/bash
# Auto-restarting dev server for IPVE Digital
# This script runs `next dev` (not standalone) and auto-restarts on crash.
export PATH=$HOME/.local/pgsql/usr/lib/postgresql/17/bin:$PATH
export PGHOST=$HOME/.local/pgsql/run
export DATABASE_URL="postgresql://z:@localhost:5432/ipve_digital"

cd /home/z/my-project

while true; do
  echo "[$(date)] Starting Next.js dev server on port 3000..."
  npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE. Restarting in 2s..." >> /home/z/my-project/dev.log
  sleep 2
done
