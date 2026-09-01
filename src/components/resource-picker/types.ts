export type ResourcePickerKey = string | number

export interface ResourcePickerTag {
  label: string
  type?: 'default' | 'info' | 'success' | 'warning' | 'error'
}

export interface ResourcePickerItem {
  id: ResourcePickerKey
  title: string
  subtitle?: string
  description?: string
  tags?: ResourcePickerTag[]
  disabled?: boolean
  raw?: unknown
}

export interface ResourcePickerLoadParams {
  tabKey: string
  keyword: string
  page: number
  pageSize: number
}

export interface ResourcePickerLoadResult<TItem extends ResourcePickerItem = ResourcePickerItem> {
  items: TItem[]
  total: number
}

export interface ResourcePickerTab<TItem extends ResourcePickerItem = ResourcePickerItem> {
  key: string
  label: string
  description?: string
  searchPlaceholder?: string
  pageSize?: number
  loadOnActivate?: boolean
  load: (params: ResourcePickerLoadParams) => Promise<ResourcePickerLoadResult<TItem>>
}

export interface ResourcePickerCardSlotScope<TItem extends ResourcePickerItem = ResourcePickerItem> {
  item: TItem
  tab: ResourcePickerTab<TItem>
  selected: boolean
  disabled: boolean
  select: () => void
}

export interface ResourcePickerToolbarSlotScope {
  tab: ResourcePickerTab
  keyword: string
  loading: boolean
  loaded: boolean
  reload: () => void
}

export interface ResourcePickerConfirmPayload<TItem extends ResourcePickerItem = ResourcePickerItem> {
  item: TItem | null
  tabKey: string
}
