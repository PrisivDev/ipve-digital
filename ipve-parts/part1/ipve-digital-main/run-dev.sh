#!/usr/bin/env bash
export PGHOST=$HOME/.local/pgsql/run
export DATABASE_URL="postgresql://z:@localhost:5432/ipve_digital"
cd /home/z/my-project
exec node node_modules/.bin/next dev -p 3000
