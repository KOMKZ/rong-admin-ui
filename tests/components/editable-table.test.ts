import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  buildTsvPastePlan,
  parseTsvMatrix,
  REditableCell,
  useCellErrorMap,
  useEditableRows,
} from '@/components/editable-table'

describe('parseTsvMatrix / buildTsvPastePlan', () => {
  it('解析多行多列 TSV 并容忍尾随空行', () => {
    expect(parseTsvMatrix('a\tb\nc\td\n')).toEqual([['a', 'b'], ['c', 'd']])
  })

  it('按锚点字段序列产出更新并报告越界', () => {
    const plan = buildTsvPastePlan('t1\tc1\nt2\tc2\nt3\tc3', {
      rowIndex: 1,
      fields: ['title', 'content'],
      maxRows: 2,
    })
    expect(plan.updates).toEqual([
      { rowIndex: 1, field: 'title', value: 't1' },
      { rowIndex: 1, field: 'content', value: 'c1' },
      { rowIndex: 2, field: 'title', value: 't2' },
      { rowIndex: 2, field: 'content', value: 'c2' },
    ])
    expect(plan.overflowRows).toBe(1)
    expect(plan.overflowCols).toBe(0)
  })

  it('多余列整体丢弃并报告', () => {
    const plan = buildTsvPastePlan('a\tb\tc', { rowIndex: 0, fields: ['title'] })
    expect(plan.updates).toEqual([{ rowIndex: 0, field: 'title', value: 'a' }])
    expect(plan.overflowCols).toBe(2)
  })
})

describe('useEditableRows', () => {
  interface Row extends Record<string, unknown> {
    rowKey: string
    title: string
    content: string
  }

  function makeRow(key: string, title: string): Row {
    return { rowKey: key, title, content: '' }
  }

  it('单元格写入后进入脏行集合，markClean 后恢复', () => {
    const state = useEditableRows<Row>()
    state.setRows([makeRow('r1', '旧标题')])
    expect(state.hasDirty).toBe(false)
    state.setCellValue('r1', 'title', '新标题')
    expect(state.isDirty('r1')).toBe(true)
    expect(state.dirtyRowKeys).toEqual(['r1'])
    state.markClean()
    expect(state.hasDirty).toBe(false)
  })

  it('新增行视为脏，还原新增行即移除', () => {
    const state = useEditableRows<Row>()
    state.setRows([])
    const added = state.addBlankRow(() => makeRow('r2', ''))
    expect(added.rowKey).toBe('r2')
    expect(state.isDirty('r2')).toBe(true)
    state.revertRow('r2')
    expect(state.rows).toHaveLength(0)
  })

  it('复制行插入到当前行之后并获得新身份，removeRows 批量移除', () => {
    let seq = 0
    const state = useEditableRows<Row>({ rowKeyFactory: () => `copy-${(seq += 1)}` })
    state.setRows([makeRow('r1', '甲'), makeRow('r3', '丙')])
    const clone = state.duplicateRow('r1')
    expect(clone?.rowKey).toBe('copy-1')
    expect(clone).not.toBeNull()
    expect(state.rows.map((row) => row.title)).toEqual(['甲', '甲', '丙'])
    state.removeRows(['r1', 'r3'])
    expect(state.rows).toHaveLength(1)
  })

  it('revertRow 恢复最近一次快照值', () => {
    const state = useEditableRows<Row>()
    state.setRows([makeRow('r1', '原始')])
    state.setCellValue('r1', 'title', '改过')
    state.revertRow('r1')
    expect(state.rows[0].title).toBe('原始')
    expect(state.isDirty('r1')).toBe(false)
  })
})

describe('useCellErrorMap', () => {
  it('按 rowKey+field 定位错误并给出首错', () => {
    const errors = useCellErrorMap()
    errors.setErrors([
      { rowKey: 'r2', field: 'content', message: '正文不能为空' },
      { rowKey: 'r1', field: 'title', message: '标题不能为空' },
    ])
    expect(errors.errorFor('r1', 'title')).toBe('标题不能为空')
    expect(errors.errorFor('r2', 'title')).toBe('')
    expect(errors.firstError?.rowKey).toBe('r2')
    expect(errors.count).toBe(2)
    errors.clearRowErrors('r2')
    expect(errors.firstError?.rowKey).toBe('r1')
    errors.clearErrors()
    expect(errors.count).toBe(0)
  })
})

describe('REditableCell', () => {
  it('视图态渲染值并暴露无障碍属性', () => {
    const wrapper = mount(REditableCell, {
      props: { value: '标题甲', type: 'text' },
    })
    expect(wrapper.text()).toContain('标题甲')
    expect(wrapper.find('.r-editable-cell').exists()).toBe(true)
  })

  it('提交新值触发 commit，Esc 取消不触发', async () => {
    const wrapper = mount(REditableCell, {
      props: { value: '旧值', type: 'text' },
    })
    await wrapper.find('.r-editable-cell__view').trigger('click')
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    input.element.value = '新值'
    await input.trigger('input')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('commit')?.[0]).toEqual(['新值'])
    await wrapper.find('.r-editable-cell__view').trigger('click')
    const input2 = wrapper.find('input')
    input2.element.value = '又一个值'
    await input2.trigger('input')
    await input2.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('commit')).toHaveLength(1)
  })

  it('错误态展示错误消息并标红', () => {
    const wrapper = mount(REditableCell, {
      props: { value: '', type: 'text', error: '标题不能为空' },
    })
    expect(wrapper.find('.r-editable-cell--error').exists()).toBe(true)
    expect(wrapper.find('.r-editable-cell__error').text()).toBe('标题不能为空')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })
})
