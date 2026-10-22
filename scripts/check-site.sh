#!/usr/bin/env bash
# The site deployed at BASE is the one built in DIST, from the Syg checkout
# SYG, and every address Syg prints finds its page there:
#
#   bash scripts/check-site.sh https://syg.vishisht.tech dist/client .syg
#
# A page can answer 200 and still be an older build, so each deployed file is
# compared with the built one, byte for byte. Every rule's address, which
# findings and `syg explain` print (/rules/AREA.html#NAME: each ## heading of
# SYG/docs/rules/AREA.md), must find its section by id. The pages the binary
# and the installers name are asked for at each spelling GitHub Pages serves,
# the install scripts are compared with SYG's, and security.txt must name a
# contact and not have expired. Pages's CDN keeps a page for up to ten
# minutes, so each attempt asks with a query of its own, and a failure is
# retried for twelve minutes (CHECK_SITE_ATTEMPTS, 30 s apart) before it
# fails.
set -euo pipefail
attempts=${CHECK_SITE_ATTEMPTS:-25}
base=${1:?usage: check-site.sh BASE DIST SYG}
dist=${2:?usage: check-site.sh BASE DIST SYG}
syg=${3:?usage: check-site.sh BASE DIST SYG}
base=${base%/}
if [ ! -f "$dist/index.html" ] || [ ! -d "$syg/docs/rules" ]; then
  echo "::error::$dist holds no built site, or $syg no Syg checkout"
  exit 1
fi
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# Every rule's address: the ## headings of each area's page, outside code.
for f in "$syg"/docs/rules/*.md; do
  area=$(basename "$f" .md)
  [ "$area" = index ] && continue
  awk -v url="$base/rules/$area.html#" '
    /^```/ { fence = !fence; next }
    !fence && /^## / { sub(/^## /, ""); print url $0 }
  ' "$f"
done > "$work/rules.txt"
if [ ! -s "$work/rules.txt" ]; then
  echo "::error::$syg/docs/rules names no rules"
  exit 1
fi

# get URL FILE: the body at URL into FILE, whatever the status.
get() { curl -sS --max-time 30 -o "$2" -w '%{http_code}' "$1" 2>/dev/null || echo 000; }

# check ATTEMPT: every problem, one per line, on stdout; none is a pass.
check() {
  local q="?check=${GITHUB_RUN_ID:-local}-$1" f rel url page id p code
  while IFS= read -r f; do
    rel=${f#"$dist/"}
    code=$(get "$base/$rel$q" "$work/got")
    if [ "$code" != 200 ] && [ "$rel" != 404.html ]; then
      echo "$code: $base/$rel"
    elif ! cmp -s "$work/got" "$f"; then
      echo "not the file built: $base/$rel"
    fi
  done < <(find "$dist" -type f | sort)
  while IFS= read -r url; do
    page=${url%%#*}
    id=${url#*#}
    code=$(get "$page$q" "$work/got")
    if [ "$code" != 200 ]; then
      echo "$code: $page"
    elif ! grep -qF "id=\"$id\"" "$work/got"; then
      echo "no section: $url"
    fi
  done < "$work/rules.txt"
  # The addresses the binary, the installers and the old links name.
  for p in install privacy eula install.html privacy.html eula.html rules/ notes/ notes/ai/ overview; do
    code=$(get "$base/$p$q" "$work/got")
    [ "$code" = 200 ] || echo "$code: $base/$p"
  done
  code=$(get "$base/no-such-page$q" "$work/got")
  [ "$code" = 404 ] || echo "$code, not 404: $base/no-such-page"
  for p in install.sh install.ps1; do
    code=$(get "$base/$p$q" "$work/got")
    if [ "$code" != 200 ]; then
      echo "$code: $base/$p"
    elif ! cmp -s "$work/got" "$syg/$p"; then
      echo "not Syg's: $base/$p"
    fi
  done
  code=$(get "$base/.well-known/security.txt$q" "$work/security.txt")
  if [ "$code" != 200 ]; then
    echo "$code: $base/.well-known/security.txt"
  elif ! grep -q '^Contact: https://' "$work/security.txt"; then
    echo "names no Contact: $base/.well-known/security.txt"
  else
    expires=$(sed -n 's/^Expires: //p' "$work/security.txt")
    if [ -z "$expires" ] || [ "$(date -u -d "$expires" +%s 2>/dev/null || echo 0)" -le "$(date -u +%s)" ]; then
      echo "expired, or no Expires: $base/.well-known/security.txt"
    fi
  fi
}

files=$(find "$dist" -type f | wc -l)
rules=$(wc -l < "$work/rules.txt")
for attempt in $(seq 1 "$attempts"); do
  check "$attempt" > "$work/problems"
  if [ ! -s "$work/problems" ]; then
    echo "$base is the site built: $files files, and $rules rules' sections"
    exit 0
  fi
  if [ "$attempt" -lt "$attempts" ]; then sleep 30; fi
done
echo "::error::$base is not the site built: $(wc -l < "$work/problems") problems"
cat "$work/problems"
exit 1
