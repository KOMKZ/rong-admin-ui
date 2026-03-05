# rong-admin-ui knowledge index

This is the local retrieval entry for `rong-admin-ui`.

## Layered map

| Level | Purpose | File |
|------|---------|------|
| L1 | hard rules and non-negotiable gates | `docs/admin-ui-framework/delivery/knowledge/L1-hard-rules.md` |
| L2 | component patterns and capability playbook | `docs/admin-ui-framework/delivery/knowledge/L2-component-playbook.md` |
| L3 | failure signatures and fix recipes | `docs/admin-ui-framework/delivery/knowledge/L3-failure-patterns.md` |
| L4 | iteration timeline and evidence pointers | `docs/admin-ui-framework/delivery/knowledge/L4-iteration-ledger.md` |

## Iteration snapshots

- Folder: `docs/admin-ui-framework/delivery/knowledge/iterations/`
- Naming: `<yyyy-mm>-<iteration-id>.md`
- Required fields: scope, decisions, gates, failures, carry-over

## Retrieval order

1. L1 (must pass)
2. L2 (reuse first)
3. L3 (avoid known regressions)
4. L4 (trace context and evidence)

## Latest pointer

- latest_iteration: `2026-03-v0.5-r3`
- latest_snapshot: `docs/admin-ui-framework/delivery/knowledge/iterations/2026-03-v0.5-r3.md`
