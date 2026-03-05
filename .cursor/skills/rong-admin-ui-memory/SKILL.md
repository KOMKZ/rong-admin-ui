---
name: rong-admin-ui-memory
description: rong-admin-ui专用本地技能。按分级知识库检索并在每次迭代后强制沉淀，避免经验丢失与重复返工。
globs:
  - "src/**"
  - "tests/**"
  - "docs/admin-ui-framework/**"
  - ".cursor/skills/rong-admin-ui-memory/**"
---

# rong-admin-ui iteration memory skill

> This skill is repo-local and dedicated to `rong-admin-ui`.

## 1) Execution flow

```
Step 0: Load layered knowledge index
-> Step 1: Classify request by knowledge level
-> Step 2: Implement with level-specific rules
-> Step 3: Run gates and collect evidence
-> Step 4: Mandatory iteration deposition
-> Step 5: Local commit (default)
```

### Step 0: Load layered knowledge index

Read first:

- `docs/admin-ui-framework/knowledge/INDEX.md`

Then load by level:

- L1 hard rules: `docs/admin-ui-framework/knowledge/L1-hard-rules.md`
- L2 component playbook: `docs/admin-ui-framework/knowledge/L2-component-playbook.md`
- L3 failure patterns: `docs/admin-ui-framework/knowledge/L3-failure-patterns.md`
- L4 iteration ledger: `docs/admin-ui-framework/knowledge/L4-iteration-ledger.md`

### Step 1: Classify request by level

- L1: architecture/design constraints and hard gates
- L2: component implementation and usage patterns
- L3: bug signatures, regressions, recovery recipes
- L4: iteration evidence and release trace

### Step 2: Implement with level-specific rules

- Must obey L1 rules first.
- Reuse L2 before creating new component patterns.
- Check L3 to avoid known failure modes.
- Update L4 when behavior or decision changes.

### Step 3: Run gates and collect evidence

- Always record command + result + evidence path.
- Evidence must be traceable to files/reports.

### Step 4: Mandatory iteration deposition

For every completed iteration, update ALL of:

1. `docs/admin-ui-framework/knowledge/iterations/<iteration-id>.md`
2. `docs/admin-ui-framework/knowledge/L3-failure-patterns.md` (if new failure pattern)
3. `docs/admin-ui-framework/knowledge/L4-iteration-ledger.md`
4. `docs/admin-ui-framework/knowledge/INDEX.md` (latest pointer)

Use template:

- `.cursor/skills/rong-admin-ui-memory/templates/ITERATION-KNOWLEDGE.md`

### Step 5: Local commit (default)

- After review + gates pass, local commit is required by default.
- Only skip local commit if user explicitly says to skip.

## 2) Non-negotiable rules

- This skill does not rely on generic shared workflow defaults.
- This skill is the source of truth for `rong-admin-ui` iteration memory.
- No iteration closure without knowledge deposition.
- No "API-only docs" for new capabilities.
- No old-style visual regressions (must satisfy modern baseline).
- No icon system mixing.

## 3) References

- `references/knowledge-levels.md`
- `templates/ITERATION-KNOWLEDGE.md`
