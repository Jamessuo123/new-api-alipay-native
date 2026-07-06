#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3001}"
COOKIE="${FX_SESSION_COOKIE:-}"

probe() {
  local path="$1"
  local expected="$2"
  local args=(-sS -o /tmp/fx-creative-smoke-body -w '%{http_code}' --connect-timeout 5 --max-time 20)
  if [[ -n "$COOKIE" ]]; then
    args+=(-H "Cookie: $COOKIE")
  fi
  local code
  code="$(curl "${args[@]}" "$BASE_URL$path" || true)"
  echo "$code  $path"
  if [[ ! "$code" =~ $expected ]]; then
    echo "[ERROR] 非预期状态码。响应：" >&2
    head -c 2000 /tmp/fx-creative-smoke-body >&2 || true
    echo >&2
    exit 1
  fi
}

probe "/api/status" '^200$'
# 未提供 Session Cookie 时，401 代表路由已注册且鉴权生效；绝不能是 404。
if [[ -n "$COOKIE" ]]; then
  expected='^200$'
else
  expected='^(200|401)$'
fi
probe "/api/creative/capabilities" "$expected"
probe "/api/creative/tasks?page=1&p=5" "$expected"
probe "/api/creative/assets?page=1&p=5" "$expected"
probe "/api/creative/assets/self?page=1&p=5" "$expected"
probe "/api/creative/projects?page=1&p=5" "$expected"
probe "/api/creative/preferences" "$expected"

rm -f /tmp/fx-creative-smoke-body
echo "[OK] P1+P2 候选版本 Smoke Test 通过。"
