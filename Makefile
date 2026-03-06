SHELL := /bin/bash

.DEFAULT_GOAL := help

PROJECT := rong-admin-ui
RUNTIME_DIR := .runtime
DEV_PID_FILE := $(RUNTIME_DIR)/dev.pid
DEV_LOG_FILE := $(RUNTIME_DIR)/dev.log
PREVIEW_PID_FILE := $(RUNTIME_DIR)/preview.pid
PREVIEW_LOG_FILE := $(RUNTIME_DIR)/preview.log

DEV_PORT ?= 5173
PREVIEW_PORT ?= 4173
PORTS ?= $(DEV_PORT) $(PREVIEW_PORT)

.PHONY: help install dev dev-bg preview preview-bg stop stop-dev stop-preview kill-ports status ports logs typecheck lint test build clean-runtime clean

help:
	@printf "\n"
	@printf "$(PROJECT) Make targets\n"
	@printf "  make install      Install dependencies\n"
	@printf "  make dev          Start Vite dev server (foreground)\n"
	@printf "  make dev-bg       Start Vite dev server (background)\n"
	@printf "  make preview      Start preview server (foreground)\n"
	@printf "  make preview-bg   Start preview server (background)\n"
	@printf "  make stop         Stop all managed processes and reclaim ports\n"
	@printf "  make status       Show managed process and port status\n"
	@printf "  make logs         Tail managed log files\n"
	@printf "  make typecheck    Run TypeScript checks\n"
	@printf "  make lint         Run ESLint\n"
	@printf "  make test         Run unit tests\n"
	@printf "  make build        Build library\n"
	@printf "  make clean        Stop services and remove runtime files\n"

install:
	pnpm install

$(RUNTIME_DIR):
	@mkdir -p "$(RUNTIME_DIR)"

dev:
	pnpm dev --port $(DEV_PORT)

dev-bg: $(RUNTIME_DIR)
	@$(MAKE) stop-dev >/dev/null
	@nohup pnpm dev --port $(DEV_PORT) > "$(DEV_LOG_FILE)" 2>&1 & echo $$! > "$(DEV_PID_FILE)"
	@sleep 1
	@printf "Started dev server on :$(DEV_PORT) (pid: %s)\n" "$$(cat "$(DEV_PID_FILE)")"

preview:
	pnpm preview --port $(PREVIEW_PORT)

preview-bg: $(RUNTIME_DIR)
	@$(MAKE) stop-preview >/dev/null
	@nohup pnpm preview --port $(PREVIEW_PORT) > "$(PREVIEW_LOG_FILE)" 2>&1 & echo $$! > "$(PREVIEW_PID_FILE)"
	@sleep 1
	@printf "Started preview server on :$(PREVIEW_PORT) (pid: %s)\n" "$$(cat "$(PREVIEW_PID_FILE)")"

stop: stop-dev stop-preview kill-ports

stop-dev:
	@if [ -f "$(DEV_PID_FILE)" ]; then \
		PID=$$(cat "$(DEV_PID_FILE)"); \
		if kill -0 $$PID >/dev/null 2>&1; then \
			kill $$PID >/dev/null 2>&1 || true; \
			sleep 1; \
			kill -9 $$PID >/dev/null 2>&1 || true; \
		fi; \
		rm -f "$(DEV_PID_FILE)"; \
	fi

stop-preview:
	@if [ -f "$(PREVIEW_PID_FILE)" ]; then \
		PID=$$(cat "$(PREVIEW_PID_FILE)"); \
		if kill -0 $$PID >/dev/null 2>&1; then \
			kill $$PID >/dev/null 2>&1 || true; \
			sleep 1; \
			kill -9 $$PID >/dev/null 2>&1 || true; \
		fi; \
		rm -f "$(PREVIEW_PID_FILE)"; \
	fi

kill-ports:
	@for port in $(PORTS); do \
		PIDS=$$(lsof -ti tcp:$$port 2>/dev/null || true); \
		for pid in $$PIDS; do \
			CMD=$$(ps -o command= -p $$pid 2>/dev/null || true); \
			if [[ "$$CMD" == *"vite"* ]] || [[ "$$CMD" == *"$(CURDIR)"* ]]; then \
				printf "Reclaiming port %s (pid: %s)\n" "$$port" "$$pid"; \
				kill $$pid >/dev/null 2>&1 || true; \
			else \
				printf "Skip port %s pid %s (non-vite process)\n" "$$port" "$$pid"; \
			fi; \
		done; \
	done

status: ports
	@if [ -f "$(DEV_PID_FILE)" ]; then printf "dev pid: %s\n" "$$(cat "$(DEV_PID_FILE)")"; else printf "dev pid: none\n"; fi
	@if [ -f "$(PREVIEW_PID_FILE)" ]; then printf "preview pid: %s\n" "$$(cat "$(PREVIEW_PID_FILE)")"; else printf "preview pid: none\n"; fi

ports:
	@for port in $(PORTS); do \
		PIDS=$$(lsof -ti tcp:$$port 2>/dev/null || true); \
		if [ -n "$$PIDS" ]; then \
			printf "port %s in use by pids: %s\n" "$$port" "$$PIDS"; \
		else \
			printf "port %s free\n" "$$port"; \
		fi; \
	done

logs:
	@if [ -f "$(DEV_LOG_FILE)" ]; then tail -n 120 "$(DEV_LOG_FILE)"; else printf "No dev log file\n"; fi
	@if [ -f "$(PREVIEW_LOG_FILE)" ]; then tail -n 120 "$(PREVIEW_LOG_FILE)"; else printf "No preview log file\n"; fi

typecheck:
	pnpm typecheck

lint:
	pnpm lint

test:
	pnpm test

build:
	pnpm build

clean-runtime:
	rm -rf "$(RUNTIME_DIR)"

clean: stop clean-runtime
