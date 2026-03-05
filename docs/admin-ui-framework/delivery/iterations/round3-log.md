# Round-3 迭代日志：Extension Components 补齐

> 日期: 2026-03-05
> 分支: feature/v0.6-modernization
> 对标基线: 一流 admin-ui 扩展组件（表单表格/密码强度/可选卡片/验证码/图标按钮）

## 目标

补齐首批高价值"业务提效型"扩展组件，在 rong-admin-web 落地真实页面。

## Step 0：Round-2 回归修复

| 问题 | 修复 |
|------|------|
| UserManagement 骨架屏死锁 | 删除 pageReady + v-if 死锁，改为直接渲染 RQueryTable |
| UserDetail 权限不匹配 | LoginPage mock 补齐 system:user:view + system:user:create |
| RPageHeader API 不一致 | 统一消费页使用 description/backUrl/#actions |
| RQueryTable checkedKeys 不回传 | 新增 update:checkedKeys emit |
| bodyCell 插槽未透传 | 改为 column render 函数模式 |

## 新增组件清单

| 组件 | 路径 | 能力 | 单测数 | Web 消费 |
|------|------|------|--------|---------|
| RFormTable | form-table/ | 批量录入 + 动态行 + 逐行校验 | 14 | BatchImportPage |
| RPasswordStrength | password-strength/ | 实时强度 + 规则提示 + 等级文案 | 12 | BatchImportPage |
| RCheckCardGroup | check-card-group/ | 卡片单/多选 + 标签 + 禁用 | 10 | TemplateSelectPage |
| RCheckButtonGroup | check-button-group/ | 按钮单/多选 + block 模式 | 10 | TemplateSelectPage |
| RCodeVerify | code-verify/ | 验证码输入 + 倒计时 + 防重复 | 10 | BatchImportPage |
| RIconButton | icon-button/ | 图标按钮 + tooltip + danger | 9 | Both pages |

## 消费方落地

| 页面 | 路由 | 使用组件 |
|------|------|---------|
| BatchImportPage (新增) | `/system/batch-import` | RFormTable + RPasswordStrength + RCodeVerify + RIconButton |
| TemplateSelectPage (新增) | `/templates` | RCheckCardGroup + RCheckButtonGroup + RIconButton |

## 门禁结果

| 门禁 | UI | Web |
|------|-----|-----|
| typecheck | ✅ | ✅ |
| lint | ✅ | ✅ |
| unit test | ✅ 632 passed | — |
| build | ✅ | ✅ |

## Failure Patterns & CAPA

### FP-1: defineProps 不能引用局部变量
- **现象**: RPasswordStrength build 失败，`DEFAULT_RULES` 被 defineProps 引用
- **根因**: Vue SFC compiler 会将 defineProps 提升到 setup 外层，不能引用 `<script setup>` 局部变量
- **纠正**: 将 DEFAULT_RULES 移到独立 `<script lang="ts">` 块（非 setup）
- **预防**: 常量默认值如需在 defineProps 中使用，必须放在非 setup 的 `<script>` 块

### FP-2: data-testid 前缀碰撞
- **现象**: `check-card-group` 的 testid 和子项 `check-card-a` 共享前缀，`findAll` 多匹配
- **根因**: `[data-testid^="check-card-"]` 同时匹配容器和子项
- **纠正**: 测试选择器改为 `button[data-testid^="check-card-"]` 限定标签类型
- **预防**: testid 命名应避免父子共享前缀，或测试用精确标签限定

### FP-3: 未使用变量未清理
- **现象**: typecheck 报 sendDisabled / vi 未使用
- **根因**: 开发过程中遗留未删除的变量
- **纠正**: 清除未使用导入和变量
- **预防**: 组件完成后立即跑 typecheck

## 技术决策

1. **RFormTable** 使用原生 `<input>/<select>` 而非 Naive UI 组件，保持轻量且避免表格内大量组件实例
2. **RPasswordStrength** 分数计算纯 computed，无 debounce 需求（每次击键即时反馈）
3. **RCheckCardGroup** 使用 CSS Grid auto-fill 实现自适应列数
4. **RCodeVerify** 倒计时 timer 在 onUnmounted 中清理，防止内存泄漏
5. **RIconButton** 条件渲染：有 tooltip 时用 NTooltip 包裹，无时直接渲染 NButton

## Round-4 建议

1. 实现 P1 组件：RPage（统一页面容器）、RRemoteSelect（远程搜索 + TTL 缓存）、RRegionCascader
2. 补齐 E2E：为 BatchImportPage 和 TemplateSelectPage 编写 Playwright smoke 测试
3. warning-free-runtime：治理 n-config-provider 注入告警，建立 Vue warn 白名单机制
