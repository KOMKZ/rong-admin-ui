export type ResourcePreviewKind = 'image' | 'video' | 'file'

export interface DetectedResource {
  id: string
  kind: ResourcePreviewKind
  label: string
  value: string
  url: string
  path: string
  previewable: boolean
}

export interface ResourcePreviewResolverContext {
  path: string
  key: string
  value: string
  inferredKind: ResourcePreviewKind
}

export type ResourcePreviewUrlResolver = (
  value: string,
  context: ResourcePreviewResolverContext,
) => string | null | undefined

export interface ResourceDetectOptions {
  maxItems?: number
  maxDepth?: number
  resolveUrl?: ResourcePreviewUrlResolver
}
