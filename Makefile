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

.PHONY: help install dev dev-bg preview preview-bg stop stop-dev stop-preview kill-ports status ports logs typecheck lint test build clean-runtime clean git-commit-merge-main

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
	@printf "  make git-commit-merge-main  Commit workspace changes then merge current branch into main (local only)\n"

git-commit-merge-main:
	@./scripts/git-commit-merge-main.sh

install:
	pnpm install

$(RUNTIME_DIR):
	@RUNTIME_DIR="$(RUNTIME_DIR)" ./scripts/runtime-control.sh ensure-runtime-dir

dev:
	pnpm dev --port $(DEV_PORT)

dev-bg: $(RUNTIME_DIR)
	@DEV_PORT="$(DEV_PORT)" DEV_PID_FILE="$(DEV_PID_FILE)" DEV_LOG_FILE="$(DEV_LOG_FILE)" ./scripts/runtime-control.sh start-dev-bg

preview:
	pnpm preview --port $(PREVIEW_PORT)

preview-bg: $(RUNTIME_DIR)
	@PREVIEW_PORT="$(PREVIEW_PORT)" PREVIEW_PID_FILE="$(PREVIEW_PID_FILE)" PREVIEW_LOG_FILE="$(PREVIEW_LOG_FILE)" ./scripts/runtime-control.sh start-preview-bg

stop: stop-dev stop-preview kill-ports

stop-dev:
	@DEV_PID_FILE="$(DEV_PID_FILE)" ./scripts/runtime-control.sh stop-dev

stop-preview:
	@PREVIEW_PID_FILE="$(PREVIEW_PID_FILE)" ./scripts/runtime-control.sh stop-preview

kill-ports:
	@PORTS="$(PORTS)" PROJECT_ROOT="$(CURDIR)" ./scripts/runtime-control.sh kill-ports

status: ports
	@DEV_PID_FILE="$(DEV_PID_FILE)" PREVIEW_PID_FILE="$(PREVIEW_PID_FILE)" ./scripts/runtime-control.sh status

ports:
	@PORTS="$(PORTS)" ./scripts/runtime-control.sh ports

logs:
	@DEV_LOG_FILE="$(DEV_LOG_FILE)" PREVIEW_LOG_FILE="$(PREVIEW_LOG_FILE)" ./scripts/runtime-control.sh logs

typecheck:
	pnpm typecheck

lint:
	pnpm lint

test:
	pnpm test

build:
	pnpm build

clean-runtime:
	@RUNTIME_DIR="$(RUNTIME_DIR)" ./scripts/runtime-control.sh clean-runtime

clean: stop clean-runtime
