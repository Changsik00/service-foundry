#!/usr/bin/env bash
# docs-lint — service-foundry 지식베이스(docs/) 정합성 검사
#   1) 깨진 [[wikilink]] (대상 노트 없음, basename 해소)
#   2) frontmatter / tags 누락 (이번 vault 가 작성한 노트만 — reference/explainers/meta)
#   3) mermaid/code fence 불균형 (``` 개수 홀수)
# 사용: bash tooling/scripts/docs-lint.sh   (repo 루트 기준)
#
# 참고: docs/adr·notes·rca·turborepo-rules 는 이전부터 있던 레거시 문서로
#       index 에서 링크만 흡수한다(개명/이관 안 함) → frontmatter 검사 제외.
set -u
ROOT="${1:-docs}"
fail=0

bases="$(mktemp)"
find "$ROOT" -name '*.md' -exec basename {} .md \; | sort -u > "$bases"

echo "=== 1) 깨진 wikilink ==="
find "$ROOT" -name '*.md' -exec grep -ohE '\[\[[^]]+\]\]' {} \; \
  | sed -E 's/^\[\[//; s/\]\]$//' \
  | sed 's/\\|/|/g'                 `# \| (표 이스케이프) → |` \
  | sed -E 's/\|.*$//; s/#.*$//'    `# 별칭·앵커 제거` \
  | sed -E 's:.*/::; s/^ +//; s/ +$//' \
  | grep -v '^$' \
  | grep -v '[<>]'                  `# CONVENTIONS 예시 placeholder 제외` \
  | grep -v ':'                     `# POSIX 정규식 클래스([[:space:]]) 오인 제외 — wikilink 타깃엔 : 없음` \
  | grep -vxE 'their-name|basename|\.\.\.|adr-\.\.\.' \
  | sort -u > "$bases.links"
broken="$(comm -23 "$bases.links" "$bases")"
if [ -n "$broken" ]; then echo "$broken" | sed 's/^/  MISSING: /'; fail=1; else echo "  OK"; fi

echo "=== 2) frontmatter / tags (vault 노트) ==="
fm=0
while IFS= read -r f; do
  [ "$(head -1 "$f")" != "---" ] && { echo "  NO-FM: $f"; fm=1; fail=1; }
  head -15 "$f" | grep -qE '^tags:' || { echo "  NO-TAGS: $f"; fm=1; fail=1; }
done < <(find "$ROOT/reference" "$ROOT/explainers" -name '*.md' 2>/dev/null; \
         ls "$ROOT"/index.md "$ROOT"/CONVENTIONS.md "$ROOT"/glossary.md "$ROOT"/log.md 2>/dev/null)
[ "$fm" -eq 0 ] && echo "  OK"

echo "=== 3) fence 균형 ==="
fc=0
while IFS= read -r f; do
  n="$(grep -cE '^```' "$f")"
  [ $((n % 2)) -ne 0 ] && { echo "  ODD($n): $f"; fc=1; fail=1; }
done < <(find "$ROOT" -name '*.md')
[ "$fc" -eq 0 ] && echo "  OK"

rm -f "$bases" "$bases.links"
echo "=== md 파일: $(find "$ROOT" -name '*.md' | wc -l | tr -d ' ') ==="
[ "$fail" -eq 0 ] && echo "✓ docs-lint PASS" || { echo "✗ docs-lint FAIL"; exit 1; }
