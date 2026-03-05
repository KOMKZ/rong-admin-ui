# L3 failure patterns and fixes

## FP-001: auth-gated e2e route access

- symptom: Playwright navigates to protected pages and lands on login/403 unexpectedly.
- root cause: tests enter protected routes without authenticated state initialization.
- fix: add shared sign-in helper and route-aware redirect login setup.
- prevention:
  - always initialize auth in e2e setup for protected paths
  - assert by stable `data-testid`

## FP-002: docs say complete but runnable gates fail

- symptom: iteration log claims completion while key e2e suites fail.
- root cause: report not aligned with executable gate outcomes.
- fix: bind report conclusion to command exit codes and artifacts.
- prevention:
  - no manual pass statement without command evidence
  - keep gate script, command list, and report in one source of truth

## FP-003: visual quality drift

- symptom: usable but old-looking UI after feature merge.
- root cause: only functional checks, missing modern-ui baseline checks.
- fix: add modern-ui-baseline and icon-consistency hard gates.
- prevention:
  - run visual rubric with evidence each iteration
  - block delivery on old-template signals
