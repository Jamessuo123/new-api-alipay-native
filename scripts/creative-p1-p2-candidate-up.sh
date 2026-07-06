#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-/www/dk_project/new-api-source}"
IMAGE="${2:-${FX_CANDIDATE_IMAGE:-}}"

if [[ -z "$IMAGE" && -f /tmp/feixiang-creative-p1-p2-candidate-image.txt ]]; then
  IMAGE="$(cat /tmp/feixiang-creative-p1-p2-candidate-image.txt)"
fi
if [[ -z "$IMAGE" ]]; then
  echo "[ERROR] 请传入候选镜像标签，或先执行 build-candidate 脚本。" >&2
  exit 1
fi

cd "$PROJECT_ROOT"

if ss -lnt 2>/dev/null | awk '{print $4}' | grep -Eq '(^|:)3001$'; then
  if ! docker ps --format '{{.Names}}' | grep -qx 'feixiangapi-newapi-candidate'; then
    echo "[ERROR] 127.0.0.1:3001 已被其他进程占用，拒绝启动。" >&2
    exit 1
  fi
fi

export FX_CANDIDATE_IMAGE="$IMAGE"
echo "[UP] 只启动候选服务到 127.0.0.1:3001；不会重建 postgres 或线上 feixiangapi。"
docker compose \
  -f docker-compose.feixiang.yml \
  -f docker-compose.creative-candidate.yml \
  up -d --no-deps --force-recreate feixiangapi-candidate

echo "[WAIT] 等待候选容器健康..."
for _ in $(seq 1 60); do
  status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' feixiangapi-newapi-candidate 2>/dev/null || true)"
  case "$status" in
    healthy)
      echo "[OK] 候选容器健康：http://127.0.0.1:3001"
      exit 0
      ;;
    unhealthy|exited|dead)
      echo "[ERROR] 候选容器状态：$status" >&2
      docker logs --tail=200 feixiangapi-newapi-candidate >&2 || true
      exit 1
      ;;
  esac
  sleep 2
done

echo "[ERROR] 候选容器健康检查超时。线上 3000 未受影响。" >&2
docker logs --tail=200 feixiangapi-newapi-candidate >&2 || true
exit 1
