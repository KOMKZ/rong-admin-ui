#!/usr/bin/env bash

set -euo pipefail

RUNTIME_DIR="${RUNTIME_DIR:-.runtime}"
DEV_PID_FILE="${DEV_PID_FILE:-${RUNTIME_DIR}/dev.pid}"
DEV_LOG_FILE="${DEV_LOG_FILE:-${RUNTIME_DIR}/dev.log}"
PREVIEW_PID_FILE="${PREVIEW_PID_FILE:-${RUNTIME_DIR}/preview.pid}"
PREVIEW_LOG_FILE="${PREVIEW_LOG_FILE:-${RUNTIME_DIR}/preview.log}"
DEV_PORT="${DEV_PORT:-5173}"
PREVIEW_PORT="${PREVIEW_PORT:-4173}"
PORTS="${PORTS:-${DEV_PORT} ${PREVIEW_PORT}}"
PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"

ensure_runtime_dir() {
  mkdir -p "${RUNTIME_DIR}"
}

stop_by_pid_file() {
  local pid_file="$1"
  if [ -f "${pid_file}" ]; then
    local pid
    pid="$(cat "${pid_file}")"
    if kill -0 "${pid}" >/dev/null 2>&1; then
      kill "${pid}" >/dev/null 2>&1 || true
      sleep 1
      kill -9 "${pid}" >/dev/null 2>&1 || true
    fi
    rm -f "${pid_file}"
  fi
}

start_dev_bg() {
  ensure_runtime_dir
  stop_by_pid_file "${DEV_PID_FILE}"
  nohup pnpm dev --port "${DEV_PORT}" > "${DEV_LOG_FILE}" 2>&1 & echo $! > "${DEV_PID_FILE}"
  sleep 1
  printf "Started dev server on :%s (pid: %s)\n" "${DEV_PORT}" "$(cat "${DEV_PID_FILE}")"
}

start_preview_bg() {
  ensure_runtime_dir
  stop_by_pid_file "${PREVIEW_PID_FILE}"
  nohup pnpm preview --port "${PREVIEW_PORT}" > "${PREVIEW_LOG_FILE}" 2>&1 & echo $! > "${PREVIEW_PID_FILE}"
  sleep 1
  printf "Started preview server on :%s (pid: %s)\n" "${PREVIEW_PORT}" "$(cat "${PREVIEW_PID_FILE}")"
}

kill_ports() {
  for port in ${PORTS}; do
    local pids
    pids="$(lsof -ti tcp:${port} 2>/dev/null || true)"
    for pid in ${pids}; do
      local cmd
      cmd="$(ps -o command= -p "${pid}" 2>/dev/null || true)"
      if [[ "${cmd}" == *"vite"* ]] || [[ "${cmd}" == *"${PROJECT_ROOT}"* ]]; then
        printf "Reclaiming port %s (pid: %s)\n" "${port}" "${pid}"
        kill "${pid}" >/dev/null 2>&1 || true
      else
        printf "Skip port %s pid %s (non-vite process)\n" "${port}" "${pid}"
      fi
    done
  done
}

print_ports() {
  for port in ${PORTS}; do
    local pids
    pids="$(lsof -ti tcp:${port} 2>/dev/null || true)"
    if [ -n "${pids}" ]; then
      printf "port %s in use by pids: %s\n" "${port}" "${pids}"
    else
      printf "port %s free\n" "${port}"
    fi
  done
}

print_status() {
  if [ -f "${DEV_PID_FILE}" ]; then
    printf "dev pid: %s\n" "$(cat "${DEV_PID_FILE}")"
  else
    printf "dev pid: none\n"
  fi

  if [ -f "${PREVIEW_PID_FILE}" ]; then
    printf "preview pid: %s\n" "$(cat "${PREVIEW_PID_FILE}")"
  else
    printf "preview pid: none\n"
  fi
}

print_logs() {
  if [ -f "${DEV_LOG_FILE}" ]; then
    tail -n 120 "${DEV_LOG_FILE}"
  else
    printf "No dev log file\n"
  fi

  if [ -f "${PREVIEW_LOG_FILE}" ]; then
    tail -n 120 "${PREVIEW_LOG_FILE}"
  else
    printf "No preview log file\n"
  fi
}

clean_runtime() {
  rm -rf "${RUNTIME_DIR}"
}

main() {
  local cmd="${1:-}"
  case "${cmd}" in
    ensure-runtime-dir)
      ensure_runtime_dir
      ;;
    start-dev-bg)
      start_dev_bg
      ;;
    start-preview-bg)
      start_preview_bg
      ;;
    stop-dev)
      stop_by_pid_file "${DEV_PID_FILE}"
      ;;
    stop-preview)
      stop_by_pid_file "${PREVIEW_PID_FILE}"
      ;;
    kill-ports)
      kill_ports
      ;;
    ports)
      print_ports
      ;;
    status)
      print_status
      ;;
    logs)
      print_logs
      ;;
    clean-runtime)
      clean_runtime
      ;;
    *)
      echo "Unknown command: ${cmd}" >&2
      echo "Usage: $0 <ensure-runtime-dir|start-dev-bg|start-preview-bg|stop-dev|stop-preview|kill-ports|ports|status|logs|clean-runtime>" >&2
      exit 1
      ;;
  esac
}

main "$@"
