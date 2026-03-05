# Release Governance

## 版本策略

采用 [Semantic Versioning](https://semver.org/)：
- **patch** (0.5.x): Bug 修复，无 API 变更
- **minor** (0.x.0): 新增功能，向后兼容
- **major** (x.0.0): 破坏性变更

## 变更日志管理 (Changesets)

### 工作流

1. **开发时**：修改 public API 后运行 `npx changeset`，选择变更类型并描述变更
2. **PR 审查**：CI 检查是否有 changeset 文件（`gate:changeset`）
3. **发布时**：运行 `npx changeset version` 自动更新版本号和 CHANGELOG
4. **发布**：运行 `npx changeset publish`

### 命令

```bash
npx changeset          # 创建变更记录
npx changeset version  # 消费变更记录，更新版本号
npx changeset publish  # 发布到 npm
```

## API 契约审计 (api-extractor)

### 用途

- 自动生成 `.api.md` 报告文件，追踪所有 public API
- 检测 API 漂移：若 API 变更但未更新报告，门禁失败
- 生成 `.api.json`，可供 api-documenter 生成文档站点

### 命令

```bash
npm run api:extract    # 提取 API 并更新报告
npm run gate:api       # 门禁检查：API 报告是否与构建产物一致
```

### 报告位置

- `reports/api/admin-ui.api.md` — 可读 API 报告
- `reports/api/admin-ui.api.json` — 机器可读 API 模型

## 门禁矩阵

| 门禁 | 命令 | 风险等级 | 说明 |
|------|------|----------|------|
| contract | `npm run gate:contract` | R2 | 类型契约完整性 |
| api | `npm run gate:api` | R2 | API 报告漂移检测 |
| changeset | `npm run gate:changeset` | R3 (CI) | 变更记录存在性 |
| release | `npm run gate:release` | R3 | 三合一发布门禁 |

## 发布前检查清单

1. `npm run typecheck` — 类型安全
2. `npm run lint` — 代码规范
3. `npm run test` — 单元测试
4. `npm run build` — 构建成功
5. `npm run gate:release` — 发布门禁三合一
6. `npm run pack:dry` — 打包产物检查
