# Quality Gate Scripts

This folder provides a single-source quality gate runner for local and CI.

- Local precheck: `bash scripts/ci/run-local.sh`
- CI gate: `bash scripts/ci/run-ci.sh`

Risk level controls enabled gates:

- `R1`: G1-G4
- `R2`: G1-G8
- `R3`: G1-G10

You can override paths when repositories are not in sibling layout:

```bash
UI_DIR=/path/to/rong-admin-ui WEB_DIR=/path/to/rong-admin-web bash scripts/ci/run-ci.sh
```
