---
'@rong/admin-ui': minor
---

新增 editable-table 表格工作台原语（ticket 000608）：`REditableCell` 可编辑单元格协议（text/textarea/select，Enter 确认、Esc 取消、错误态定位）、`useEditableRows` 行编辑状态（脏行集合/新增/复制/移除/还原）、`buildTsvPastePlan` + `parseTsvMatrix` 多行多列 TSV 粘贴（越界报告）、`useCellErrorMap` 单元格错误映射（首错定位）。中立协议，不含业务字段；文案库与创作路线工作台为首个消费方。
