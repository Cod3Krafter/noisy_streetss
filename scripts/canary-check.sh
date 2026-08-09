#!/usr/bin/env bash
#
# Canary check for the 2024-2026 repo injector.
#
# Detects the two known payload shapes and the injector's marker files. Designed to be
# run three ways, all from this one script:
#
#   CI            .github/workflows/canary.yml calls it
#   pre-push      cp to .git/hooks/pre-push (or point core.hooksPath at it)
#   manually      bash scripts/canary-check.sh
#
# Exit 0 = clean, exit 1 = something matched.
#
# Design notes, each earned the hard way during the incident:
#   - PostCSS is checked by SIZE, not by grepping for a string. A grep for
#     "createRequire" declared an infected repo clean, because the CommonJS variant
#     needs no such line. Size caught what the string search missed.
#   - Fonts are checked by HEADER, not by extension. The fake font was named
#     .woff2 and began with four spaces.
#   - .eot files are skipped: they have no magic number (their first 4 bytes are the
#     file's own length), so header-checking them produces false positives.

set -uo pipefail

fail=0
note() { printf '  %s\n' "$*"; }
flag() { printf 'FAIL  %s\n' "$*"; fail=1; }

# Only look at files git tracks, so node_modules and build output are out of scope.
if git rev-parse --git-dir >/dev/null 2>&1; then
  files=$(git ls-files)
else
  files=$(find . -type f -not -path './.git/*' | sed 's|^\./||')
fi

echo "canary: scanning $(printf '%s\n' "$files" | grep -c . ) tracked files"

# ---------------------------------------------------------------- 1. PostCSS size
# A legitimate config is 69-170 bytes. Every infected one was 9295-9370.
while IFS= read -r f; do
  [ -f "$f" ] || continue
  size=$(wc -c < "$f" | tr -d ' ')
  if [ "$size" -gt 400 ]; then
    flag "$f is ${size} bytes; a real PostCSS config is under 200"
  fi
done < <(printf '%s\n' "$files" | grep -E '(^|/)postcss\.config\.[a-z]+$' || true)

# ------------------------------------------------------- 2. Auto-running editor task
# "runOn": "folderOpen" executes the moment the folder is opened in VS Code.
while IFS= read -r f; do
  [ -f "$f" ] || continue
  if grep -q 'folderOpen' "$f" 2>/dev/null; then
    flag "$f contains folderOpen; a task set to run on folder open"
  fi
done < <(printf '%s\n' "$files" | grep -E '(^|/)\.vscode/tasks\.json$' || true)

# --------------------------------------------------------------- 3. Font headers
# Valid: wOF2 774f4632 | wOFF 774f4646 | TrueType 00010000 | OTTO 4f54544f | true 74727565
# .eot is deliberately excluded: no magic number, so it cannot be checked this way.
while IFS= read -r f; do
  [ -f "$f" ] || continue
  hdr=$(od -A n -t x1 -N 4 "$f" 2>/dev/null | tr -d ' \n')
  case "$hdr" in
    774f4632|774f4646|00010000|4f54544f|74727565) ;;
    *) flag "$f has header ${hdr}, which is not a font; it may be a script in disguise" ;;
  esac
done < <(printf '%s\n' "$files" | grep -Ei '\.(woff2?|ttf|otf)$' || true)

# ------------------------------------------------------- 4. Injector marker files
# Harmless in themselves, but present in EVERY injection across all four accounts.
while IFS= read -r f; do
  [ -f "$f" ] || continue
  if grep -qE '^(branch_structure\.json|temp_auto_push\.bat|temp_interactive_push\.bat)' "$f" 2>/dev/null; then
    flag "$f lists the injector's temp files; the tool has run against this repo"
  fi
done < <(printf '%s\n' "$files" | grep -E '(^|/)\.gitignore$' || true)

if [ "$fail" -eq 0 ]; then
  echo "canary: clean"
else
  echo
  echo "canary: FAILED. Do not build or open this repo in an editor until reviewed."
  echo "Do not run or open the flagged file to inspect it."
fi

exit "$fail"
