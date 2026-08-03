#!/usr/bin/env bash
# docker-build.sh
# Loads .env.local, exports vars, then runs docker compose build + up
# Usage: ./docker-build.sh

set -euo pipefail

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌  $ENV_FILE not found. Aborting."
  exit 1
fi

echo "📦  Loading env vars from $ENV_FILE …"

# Export every non-comment, non-empty line from .env.local
set -o allexport
# Strip surrounding quotes from values so export works cleanly
while IFS= read -r line || [ -n "$line" ]; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue   # skip comments
  [[ -z "${line// }" ]] && continue              # skip blank lines
  # Strip leading/trailing whitespace and surrounding quotes
  key="${line%%=*}"
  val="${line#*=}"
  val="${val%\"}"
  val="${val#\"}"
  export "$key=$val"
done < "$ENV_FILE"
set +o allexport

echo "🔨  Building Docker images (this may take a few minutes) …"
docker compose build

echo "🚀  Starting containers …"
docker compose up -d

echo ""
echo "✅  All containers started!"
echo ""
docker compose ps
echo ""
echo "🌐  App is live at: http://localhost"
echo "📊  Check cache: docker exec events_redis redis-cli keys '*'"
