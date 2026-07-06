#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-/www/dk_project/new-api-source}"
STAMP="$(date +%Y%m%d-%H%M%S)"
IMAGE="${FX_CANDIDATE_IMAGE:-feixiangapi-newapi:creative-p1-p2-$STAMP}"

cd "$PROJECT_ROOT"

echo "[BUILD] 仅构建候选镜像，不重启任何容器：$IMAGE"
DOCKER_BUILDKIT=1 docker build \
  --progress=plain \
  -f Dockerfile.feixiang \
  -t "$IMAGE" \
  .

echo "$IMAGE" | tee /tmp/feixiang-creative-p1-p2-candidate-image.txt
echo "[DONE] 候选镜像已构建。线上 3000 容器未被修改。"
