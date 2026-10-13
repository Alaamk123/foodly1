#!/bin/sh
# 1) wait for MongoDB, create indexes, run the (safe) migration, seed ONLY an empty database
node scripts/init-db.js

# 2) start the API. `exec` makes node PID 1's replacement so it receives `docker compose stop` (SIGTERM).
if [ "$NODE_ENV" = "development" ]; then
  exec npx nodemon -L server.js   # -L: file watching that works on Docker for Windows/macOS
else
  exec node server.js
fi
