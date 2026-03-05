export type SkeletonMode = 'list' | 'detail' | 'form'

export interface PageSkeletonProps {
  mode: SkeletonMode
  rows?: number
  animated?: boolean
  columns?: number
  showHeader?: boolean
  showToolbar?: boolean
  showPagination?: boolean
}
