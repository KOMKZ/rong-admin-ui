# Docs Split Migration (v0.6)

## Problem

Iteration artifacts and product docs were mixed at the same level, making retrieval noisy.

## Mapping

- `docs/admin-ui-framework/iteration/*`
  -> `docs/admin-ui-framework/delivery/iterations/*`
- `docs/admin-ui-framework/quality-gates/*`
  -> `docs/admin-ui-framework/delivery/quality-gates/*`
- `docs/admin-ui-framework/phase-1-foundation/*`
  -> `docs/admin-ui-framework/delivery/phase-1-foundation/*`
- `docs/admin-ui-framework/phase-2-components/TASKS.md|design.md|git-task-card.md|review-report.md|v0.6-modernization-design.md`
  -> `docs/admin-ui-framework/delivery/phase-2-components/*`
- `docs/admin-ui-framework/knowledge/*`
  -> `docs/admin-ui-framework/delivery/knowledge/*`

## Product-doc relocation

- `docs/admin-ui-framework/phase-2-components/dev-guide.md`
  -> `docs/admin-ui-framework/components/dev-guide.md`
- `docs/admin-ui-framework/phase-2-components/data-table-spec.md`
  -> `docs/admin-ui-framework/components/spec-data-table.md`
- `docs/admin-ui-framework/phase-2-components/form-renderer-spec.md`
  -> `docs/admin-ui-framework/components/spec-form-renderer.md`
- `docs/admin-ui-framework/phase-2-components/v0.6-components-docs.md`
  -> `docs/admin-ui-framework/components/commercial-components-v0.6.md`

## Follow-up rule

- New iteration evidence goes to `delivery/**` only.
- Stable guidance goes to product-doc directories only.
