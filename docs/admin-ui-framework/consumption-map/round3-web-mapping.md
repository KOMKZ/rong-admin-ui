# Round-3 Web 消费映射

> 日期: 2026-03-05

## 消费页面清单

| 页面 | 路由 | 使用组件 | 状态 |
|------|------|---------|------|
| BatchImportPage | `/system/batch-import` | RFormTable, RPasswordStrength, RCodeVerify, RIconButton, RPageHeader, RResultState | ✅ |
| TemplateSelectPage | `/templates` | RCheckCardGroup, RCheckButtonGroup, RIconButton, RPageHeader | ✅ |

## 组件 → 消费方映射

| 组件 | 消费页面 | 用法说明 |
|------|---------|---------|
| RFormTable | BatchImportPage | 批量录入用户数据（姓名/邮箱/角色/部门） |
| RPasswordStrength | BatchImportPage | 设置统一初始密码 + 强度反馈 |
| RCodeVerify | BatchImportPage | 管理员身份验证（发送 + 倒计时） |
| RIconButton | BatchImportPage, TemplateSelectPage | 工具栏操作按钮（帮助/下载/刷新/视图切换） |
| RCheckCardGroup | TemplateSelectPage | 项目模板选择（6 模板卡片，单选） |
| RCheckButtonGroup | TemplateSelectPage | 功能模块多选 + 密度单选切换 |

## 路由变更

新增路由：
- `GET /system/batch-import` — 权限 `system:user:create`
- `GET /templates` — 无权限限制

## 依赖关系

```
BatchImportPage
├── RPageHeader (layout)
├── RFormTable (form-table)
│   └── RIcon (icon)
├── RPasswordStrength (password-strength)
│   ├── NInput (naive-ui via primitives)
│   └── RIcon (icon)
├── RCodeVerify (code-verify)
│   ├── NInput (naive-ui via primitives)
│   └── NButton (naive-ui via primitives)
├── RIconButton (icon-button)
│   ├── NButton (naive-ui via primitives)
│   ├── NTooltip (naive-ui via primitives)
│   └── RIcon (icon)
└── RResultState (result-state)

TemplateSelectPage
├── RPageHeader (layout)
├── RCheckCardGroup (check-card-group)
│   └── RIcon (icon)
├── RCheckButtonGroup (check-button-group)
│   └── RIcon (icon)
└── RIconButton (icon-button)
```
