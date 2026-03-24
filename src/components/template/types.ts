/** Item shape for {@link RTemplateBrowser}. */
export interface RTemplateBrowserItem {
  id: number
  name: string
  description?: string
  category?: string
  /** JSON string or string[] from API */
  tags?: string | string[]
  avg_rating?: number
  usage_count?: number
}
