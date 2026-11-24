#!/usr/bin/env bash
# 依存の導入・型チェック・成果物を消してからのビルド・xrift check を順に行う。
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

git diff --check "$(git hash-object -t tree /dev/null)" HEAD
npm ci --no-audit --no-fund
npm run typecheck
node --test scripts/check-report.test.mjs
rm -rf -- dist
npm run build

report="$(mktemp)"
trap 'rm -f -- "$report"' EXIT
# 種類（world / item）を書かない。書くと --build・--json が親のコマンドに取られて子に渡らない（xrift-poc #57）。
status=0
xrift check --json > "$report" || status=$?
node scripts/check-report.mjs "$report" "$status"
