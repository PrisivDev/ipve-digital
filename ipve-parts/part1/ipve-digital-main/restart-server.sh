#!/bin/bash
# Quick restart script for the IPVE Digital dev server
# Kills existing server and starts a fresh one
export PGHOST=$HOME/.local/pgsql/run
export DATABASE_URL="postgresql://z:@localhost:5432/ipve_digital"
cd /home/z/my-project

echo "Killing existing server..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

echo "Starting dev server..."
nohup npx next dev -p 3000 > /home/z/my-project/dev.log 2>&1 &
echo "Server PID: $!"

# Wait and verify
for i in $(seq 1 30); do
    if ss -tlnp 2>/dev/null | rg -q ":3000 "; then
        SIZE=$(curl -s -m 15 http://localhost:3000 | wc -c)
        echo "Server ready! Serving ${SIZE} bytes at http://localhost:3000"
        exit 0
    fi
    sleep 1
done

echo "WARNING: Server did not start within 30 seconds"
exit 1
