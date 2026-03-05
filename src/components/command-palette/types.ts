export interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: string
  shortcut?: string
  group?: string
  disabled?: boolean
}

export interface CommandGroup {
  id: string
  label: string
  items: CommandItem[]
}

export interface RCommandPaletteProps {
  visible: boolean
  items: CommandItem[]
  placeholder?: string
  emptyText?: string
  loading?: boolean
}

export interface RCommandPaletteEmits {
  (e: 'update:visible', value: boolean): void
  (e: 'select', item: CommandItem): void
  (e: 'search', query: string): void
}
