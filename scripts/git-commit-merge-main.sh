#!/usr/bin/env bash

set -euo pipefail

repo_path="$(pwd)"
status="FAIL"
reason=""
current_branch=""
commit_result="not executed"
merge_result="not executed"
final_branch=""

print_report() {
  echo "=== Local Git Merge Report ==="
  echo "Repository: ${repo_path}"
  if [ -n "${current_branch}" ]; then
    echo "Source branch: ${current_branch}"
  else
    echo "Source branch: N/A"
  fi
  echo "Commit: ${commit_result}"
  echo "Merge: ${merge_result}"
  if [ -n "${final_branch}" ]; then
    echo "Current branch now: ${final_branch}"
  fi
  if [ -n "${reason}" ]; then
    echo "Reason: ${reason}"
  fi
  echo "Result: ${status}"
}

on_exit() {
  local rc=$?
  if [ "${rc}" -ne 0 ] && [ -z "${reason}" ]; then
    reason="git operation failed (check git output above)"
  fi
  print_report
}

trap on_exit EXIT

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  reason="current directory is not a git repository"
  exit 1
fi

current_branch="$(git branch --show-current)"
if [ -z "${current_branch}" ]; then
  reason="detached HEAD is not supported"
  exit 1
fi

if ! git show-ref --verify --quiet refs/heads/main; then
  reason="local branch 'main' does not exist"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "chore: save workspace changes before local main merge"
  commit_result="created commit $(git rev-parse --short HEAD) on ${current_branch}"
else
  commit_result="no workspace changes to commit"
fi

if [ "${current_branch}" = "main" ]; then
  merge_result="already on main, merge skipped"
  final_branch="main"
  status="PASS"
  exit 0
fi

git checkout main
git merge --no-ff "${current_branch}"

merge_result="merged ${current_branch} into main at $(git rev-parse --short HEAD)"
final_branch="$(git branch --show-current)"
status="PASS"
