#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting Next.js dev server..."
  npx next dev -p 3000 -H 0.0.0.0 2>&1 &
  PID=$!
  # Wait for the process to exit
  wait $PID
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..."
  sleep 3
done
