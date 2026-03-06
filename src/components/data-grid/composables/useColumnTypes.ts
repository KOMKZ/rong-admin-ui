import type { ColDef } from 'ag-grid-community'
import type { DataGridColumn, DataGridColumnType } from '../types'
import SelectCellEditor from '../components/SelectCellEditor.vue'
import MultiSelectCellEditor from '../components/MultiSelectCellEditor.vue'
import SelectCellRenderer from '../components/SelectCellRenderer.vue'
import MultiSelectCellRenderer from '../components/MultiSelectCellRenderer.vue'
import DateTimeCellEditor from '../components/DateTimeCellEditor.vue'
import YearCellEditor from '../components/YearCellEditor.vue'
import CustomHeader from '../components/CustomHeader.vue'

export function useColumnTypes() {
  function toAgColDef(col: DataGridColumn, readonly: boolean, useCustomHeader = false): ColDef {
    const colDef: ColDef = {
      field: col.field,
      headerName: col.headerName,
      editable: readonly ? false : (col.editable ?? true),
      sortable: col.sortable ?? true,
      filter: col.filterable ?? true,
      resizable: true,
      flex: 1,
      minWidth: col.width ?? 100,
      context: { __columnType: col.type || 'text' },
    }

    if (useCustomHeader && !readonly && col.field !== 'id') {
      colDef.headerComponent = CustomHeader
    }

    switch (col.type) {
      case 'number':
        colDef.filter = 'agNumberColumnFilter'
        colDef.cellDataType = 'number'
        break
      case 'date':
        colDef.cellEditor = 'agDateCellEditor'
        colDef.cellEditorParams = { min: '1900-01-01', max: '2099-12-31' }
        break
      case 'datetime':
        colDef.cellEditor = DateTimeCellEditor as any
        colDef.cellEditorPopup = true
        break
      case 'year':
        colDef.cellEditor = YearCellEditor as any
        break
      case 'select':
        colDef.cellEditor = SelectCellEditor as any
        colDef.cellEditorParams = { values: col.options ?? ['选项1', '选项2', '选项3'] }
        colDef.cellRenderer = SelectCellRenderer as any
        break
      case 'multiselect':
        colDef.cellEditor = MultiSelectCellEditor as any
        colDef.cellEditorParams = { values: col.options ?? [] }
        colDef.cellRenderer = MultiSelectCellRenderer as any
        break
      case 'boolean':
        colDef.cellEditor = 'agCheckboxCellEditor'
        colDef.cellRenderer = 'agCheckboxCellRenderer'
        break
      case 'text':
      default:
        break
    }

    return colDef
  }

  function fromAgColDef(colDef: ColDef): DataGridColumn {
    const ctx = (colDef as any).context || {}
    let type: DataGridColumnType = ctx.__columnType || 'text'

    if (!ctx.__columnType) {
      if (colDef.cellDataType === 'number' || colDef.filter === 'agNumberColumnFilter') {
        type = 'number'
      } else if (colDef.cellEditor === 'agDateCellEditor') {
        type = 'date'
      }
    }

    return {
      field: colDef.field ?? '',
      headerName: (colDef.headerName as string) ?? '',
      type,
      width: colDef.width ?? colDef.minWidth,
      editable: colDef.editable as boolean | undefined,
      sortable: colDef.sortable as boolean | undefined,
      filterable: colDef.filter !== false,
      options: colDef.cellEditorParams?.values,
    }
  }

  function getDefaultValue(type?: DataGridColumnType): unknown {
    switch (type) {
      case 'number':
        return null
      case 'boolean':
        return false
      case 'multiselect':
        return []
      default:
        return ''
    }
  }

  return { toAgColDef, fromAgColDef, getDefaultValue }
}
