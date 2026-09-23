#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
branch="${DEPLOY_BRANCH:-main}"

cd "${project_dir}"

git fetch --prune origin "${branch}"
git checkout "${branch}"
git reset --hard "origin/${branch}"

docker compose -f compose.prod.yaml up -d --build --remove-orphans

for attempt in $(seq 1 30); do
  if docker compose -f compose.prod.yaml exec -T api \
    node -e "fetch('http://127.0.0.1:4000/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
    printf 'Production deployment is ready.\n'
    exit 0
  fi

  printf 'Waiting for application readiness (%s/30)...\n' "${attempt}"
  sleep 2
done

docker compose -f compose.prod.yaml logs --tail=100 api
printf 'Production deployment failed its readiness check.\n' >&2
exit 1
