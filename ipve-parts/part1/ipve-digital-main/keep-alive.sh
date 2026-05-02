#!/bin/bash
# Keep-alive script for Next.js dev server
cd /home/z/my-project
export PGHOST=$HOME/.local/pgsql/run
export DATABASE_URL="postgresql://z:@localhost:5432/ipve_digital"

while true; do
    echo "[$(date)] Starting Next.js dev server..."
    node node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev-server.log 2>&1
    EXIT_CODE=$?
    echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 2s..."
    sleep 2
done
