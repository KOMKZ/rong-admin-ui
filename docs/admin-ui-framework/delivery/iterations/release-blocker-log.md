# Release Blocker 收口修复日志

> 日期: 2026-03-05
> 分支: release/v0.9.0
> 目标: 从 "Demo Ready" 提升到 "Release Ready"，quality-gate R3 全绿

## 修复清单

### P0-1: Contract Parity — vite lib entry 补齐

- **问题**: `gate:contract` 报 vite lib entry missing，8 个组件无独立 chunk 入口
- **根因**: `vite.config.ts` 的 `build.lib.entry` 中遗漏 icon / stat-card / kpi-grid / drawer-form / empty-state / result-state / command-palette / notification-center
- **修复**: 在 `vite.config.ts` entry 对象中补齐 8 条入口映射
- **验证**: `npm run gate:contract` → PASS

### P0-2: Quality-gate 参数透传

- **问题**: `npm run quality-gate -- --risk R3` 实际仍按 R2 执行，G11-G14 不触发
- **根因**: `scripts/quality-gate.sh` 使用 `${RISK_LEVEL:-R2}` 环境变量，忽略了 npm 传入的 CLI `$@` 参数
- **修复**: 重写 wrapper 脚本，解析 `--risk` / `--report-dir` CLI 参数后透传到 `ci/quality-gate.sh`，保持环境变量作为 fallback
- **验证**: `npm run quality-gate -- --risk R3` → Risk Level: R3, G1-G14 全部执行

### P0-3: Format Check 违规（附带发现）

- **问题**: G3 format-check 失败，大量文件 prettier 格式不一致
- **根因**: 历史迭代中未执行 `prettier --write` 统一格式
- **修复**: `npx prettier --write 'src/**/*.{ts,vue,json}'`
- **验证**: `npm run format:check` → All matched files use Prettier code style!

### P0-4: Coverage Global 不达标（附带发现）

- **问题**: G6 coverage-global 82.74% < 85% 阈值
- **根因**: result-state / empty-state / kpi-grid 覆盖率为 0%
- **修复**: 新增 3 个测试文件共 26 条测试覆盖关键路径
- **验证**: 覆盖率提升至 85.03% → PASS

### P1-1: NotificationCenter 单测补齐

- **问题**: 新增组件 coverage 近 0
- **修复**: 新增 `tests/components/notification-center.test.ts`，11 条测试覆盖：
  - 初始渲染与空态
  - unread 计数
  - push 后列表更新
  - markRead / markAllRead
  - dismiss / clearAll
  - action 回调触发
  - maxVisible 尊重
- **验证**: 组件覆盖率 96.55% lines

### P1-2: Expose 契约空实现修复

- **问题**: `RPasswordStrength.focus()` 和 `RCodeVerify.focus()` 为空函数
- **根因**: defineExpose 中 `focus: () => {}` 未持有 NInput ref
- **修复**:
  - PasswordStrength: 新增 `inputRef = ref<NInput>()` 绑定到模板，`focus` 委托到 `inputRef.value?.focus()`
  - CodeVerify: 新增 `codeInputRef = ref<NInput>()` 绑定到模板，同理委托
- **验证**: 各新增 1 条单测确认 `focus()` 不抛异常且为真实函数

## 质量门禁总表（R3 全量）

| Gate | ID | Description | Result |
|------|----|-------------|--------|
| G1 | typecheck | vue-tsc --noEmit (UI + Web) | PASS |
| G2 | lint | eslint --max-warnings 0 (UI + Web) | PASS |
| G3 | format-check | prettier --check | PASS |
| G4 | unit | vitest run (UI 659 + Web 4) | PASS |
| G5 | integration | vitest run integration | PASS |
| G6 | coverage-global | lines >= 85% | PASS (85.03%) |
| G7 | coverage-changed | changed files coverage | PASS |
| G8 | contract-parity | gate:contract (entry parity) | PASS |
| G9 | web-consumption | gate:consumption (CSS + import) | PASS |
| G10 | e2e-smoke | playwright @smoke (24 tests) | PASS |
| G11 | build-parity | UI build + Web build | PASS |
| G12 | css-import-check | @rong/admin-ui/style.css 导入检查 | PASS |
| G13 | style-load-verification | style-load.spec.ts (4 tests) | PASS |
| G14 | pack-consumption-smoke | npm pack → tgz → web build | PASS |

## Failure Patterns & CAPA

### FP-1: vite lib entry 与 barrel export 不同步
- **预防**: gate:contract 脚本已自动检测，纳入 CI 常规检查
- **规则**: 每次新增组件时同步更新 vite.config.ts entry 与 components/index.ts

### FP-2: Shell wrapper 参数吞没
- **预防**: wrapper 脚本必须解析并透传 `$@`，环境变量仅作 fallback
- **规则**: npm scripts 的参数透传必须有集成测试验证

### FP-3: 零覆盖组件拉低全局阈值
- **预防**: 新增组件必须同时交付最小测试套件
- **规则**: gate:contract 扩展为同时检查测试文件存在性

## 改动文件清单

### P0
- `rong-admin-ui/vite.config.ts` — 补齐 8 条 lib entry
- `rong-admin-ui/scripts/quality-gate.sh` — CLI 参数透传
- `rong-admin-ui/src/**/*.{ts,vue}` — prettier 格式统一

### P1
- `rong-admin-ui/tests/components/notification-center.test.ts` — 新增 (11 tests)
- `rong-admin-ui/tests/components/result-state.test.ts` — 新增 (11 tests)
- `rong-admin-ui/tests/components/empty-state.test.ts` — 新增 (8 tests)
- `rong-admin-ui/tests/components/kpi-grid.test.ts` — 新增 (7 tests)
- `rong-admin-ui/src/components/password-strength/RPasswordStrength.vue` — focus() 真实实现
- `rong-admin-ui/src/components/code-verify/RCodeVerify.vue` — focus() 真实实现
- `rong-admin-ui/tests/components/password-strength.test.ts` — 新增 focus 验证
- `rong-admin-ui/tests/components/code-verify.test.ts` — 新增 focus 验证

## 风险与回滚

- **风险**: prettier 批量格式化产生大量 diff，review 时需注意区分格式变更与逻辑变更
- **回滚**: 所有改动在 `release/v0.9.0` 分支，可 `git revert` 或 `git reset` 至修复前 commit

## 结论

**Release Ready: 是** — G1~G14 全绿 (14/14 PASS, 0 FAIL)，Risk Level R3。
