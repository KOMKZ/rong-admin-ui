# L2 component playbook

## Commercial baseline components

At least two items should move each iteration:

- KPI and stat cards
- advanced filter bar
- drawer form flow
- empty/result states
- command palette

## Implementation playbook

- Contract first: props/emits/slots/states.
- Provide stable test ids for key interactions.
- Build demo matrix: basic, advanced, loading-empty-error, disabled-readonly, theme-variant.
- Ensure real usage path in `rong-admin-webdemo`.

## Documentation playbook

Each component doc must include:

- when to use / when not to use
- interaction notes
- accessibility checklist
- migration or replacement note

## Design-system playbook

- Token-first styling.
- Theme switching through token overrides only.
- Icon usage through one entrypoint and one visual grammar.
