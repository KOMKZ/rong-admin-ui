# Admin UI Framework Docs

## Why this was reorganized

The previous structure mixed two different concerns in one level:

- long-lived product documentation (capability and API docs)
- iteration delivery artifacts (tasks, logs, gate reports, review evidence)

That caused retrieval noise and made it hard to locate stable docs quickly.

## New split

- Product docs (stable, reusable):
  - `components/`
  - `features/`
  - `interfaces/`
  - `modules/`
  - `consumption-map/`
  - `phase-3-productization/`

- Iteration artifacts (time/version scoped):
  - `delivery/iterations/`
  - `delivery/quality-gates/`
  - `delivery/phase-1-foundation/`
  - `delivery/phase-2-components/`
  - `delivery/knowledge/`

## Storage rules

- Any file containing version-specific execution evidence goes to `delivery/**`.
- Any file intended as evergreen guidance goes to product doc directories.
- New iteration must update `delivery/knowledge/INDEX.md` and ledger/snapshot files.

## Migration record

- See `docs/admin-ui-framework/delivery/MIGRATION-v0.6.md` for old->new path mapping.
