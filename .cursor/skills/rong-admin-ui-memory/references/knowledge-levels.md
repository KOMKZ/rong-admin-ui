# Knowledge levels for rong-admin-ui

This is a repo-local, layered retrieval model.

## L1: hard rules

Scope:

- quality gates
- architecture boundaries
- visual/icon hard constraints

Storage:

- `docs/admin-ui-framework/delivery/knowledge/L1-hard-rules.md`

## L2: component playbook

Scope:

- reusable component patterns
- composition standards
- usage and replacement guidance

Storage:

- `docs/admin-ui-framework/delivery/knowledge/L2-component-playbook.md`

## L3: failure patterns

Scope:

- recurring bug signatures
- root cause and fix recipes
- guardrails for regression prevention

Storage:

- `docs/admin-ui-framework/delivery/knowledge/L3-failure-patterns.md`

## L4: iteration ledger

Scope:

- release/iteration timeline
- gate outcomes
- decision and evidence index

Storage:

- `docs/admin-ui-framework/delivery/knowledge/L4-iteration-ledger.md`
- `docs/admin-ui-framework/delivery/knowledge/iterations/*.md`

## Update policy

- L1 updates only when standards/gates change.
- L2 updates when a component capability or protocol changes.
- L3 updates when new failure mode appears.
- L4 updates every iteration.
