#!/bin/bash
cd /home/z/my-project
while true; do
  echo "$(date '+%H:%M:%S') Starting server..." >> /tmp/ipve-server.log
  node --max-old-space-size=512 node_modules/.bin/next dev -p 3000 -H 0.0.0.0 >> /tmp/ipve-server.log 2>&1
  echo "$(date '+%H:%M:%S') Server died, waiting 2s..." >> /tmp/ipve-server.log
  sleep 2
done
