#!/bin/bash
cd /home/z/my-project
while true; do
  NODE_ENV=production node .next/standalone/server.js -H 0.0.0.0 -p 3000
  echo "Server exited, restarting in 2s..."
  sleep 2
done
