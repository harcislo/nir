#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="${project_dir}/backups"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="${backup_dir}/measurement_portal_${timestamp}.dump"

mkdir -p "${backup_dir}"

docker_command=(docker)
if ! docker info >/dev/null 2>&1; then
  docker_command=(sudo docker)
fi

cd "${project_dir}"
"${docker_command[@]}" compose exec -T postgres \
  pg_dump --username measurement --dbname measurement_portal --format custom > "${backup_file}"

printf 'Database backup created: %s\n' "${backup_file}"

