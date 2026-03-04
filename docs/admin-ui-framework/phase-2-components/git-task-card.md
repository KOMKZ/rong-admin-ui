# Git Task Card — Phase 2 组件能力标准化

## 任务信息

- 任务名：Phase 1 Hardening + Phase 2 组件能力标准化
- 目标仓库：`rong-admin-ui`
- 分支：`feature/phase1-hardening-v0.2`
- 基准分支：`main`（含 v0.1 全部内容）
- 关联仓库：`rong-admin-web` → `feature/framework-integration-v0.2`

## 任务边界

### 包含

1. http-client 错误语义重构（RequestErrorKind + mergeSignals）
2. token-manager 幂等刷新 + 跨 tab 同步完善
3. bootstrap destroy 生命周期闭环
4. route-generator notFoundComponent 落地
5. 4 个组件契约类型定义（DataTable/FormRenderer/ModalDialog/FileUpload）
6. 12 个测试文件 / 68 个 unit + integration tests
7. @vitest/coverage-v8 安装 + 覆盖率阈值硬门禁
8. Phase 2 设计文档 + 任务清单 + 质量报告 + 迭代日志

### 不包含

- 组件 Vue SFC 实现（Phase 3）
- E2E / Playwright 测试
- npm publish / 版本发布
- 业务逻辑

## 验收标准

- [x] TypeCheck 零错误
- [x] ESLint 零警告
- [x] Prettier 格式一致
- [x] 68/68 tests PASS
- [x] Coverage lines >= 85% (actual: 92.56%)
- [x] Coverage branches >= 70% (actual: 86.57%)
- [x] rong-admin-web TypeCheck PASS
- [x] web-consumption 证据：FrameworkDemo + Story 页面

## 风险与回滚

- `RequestError` 增加了 `kind` 字段 — 不兼容旧的 `code` 判断逻辑
- 回滚：`git revert` 到 v0.1 tag / main 分支
