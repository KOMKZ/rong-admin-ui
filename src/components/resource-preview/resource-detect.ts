import type { DetectedResource, ResourceDetectOptions, ResourcePreviewKind } from './types'

const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']
const videoExtensions = ['.mp4', '.webm', '.mov', '.m4v', '.m3u8', '.avi']
const imageKeyPattern =
  /(image|img|picture|pic|photo|avatar|cover|poster|thumbnail|thumb|tup|tu|图|封面)/i
const videoKeyPattern = /(video|movie|media|play|preview|render|视频)/i
const filePathPattern = /^(?:\.?\/)?[\w./:@-]+(?:\?.*)?(?:#.*)?$/

export function detectJsonResources(
  value: unknown,
  options: ResourceDetectOptions = {},
): DetectedResource[] {
  const maxItems = options.maxItems ?? 24
  const maxDepth = options.maxDepth ?? 10
  const resources: DetectedResource[] = []
  const seen = new Set<string>()

  visit(parseMaybeJson(value), '$', '', 0)
  return resources

  function visit(current: unknown, path: string, key: string, depth: number): void {
    if (resources.length >= maxItems || depth > maxDepth) return
    if (typeof current === 'string') {
      addStringResource(current, path, key)
      const parsed = parseMaybeJson(current)
      if (parsed !== current) visit(parsed, path, key, depth + 1)
      return
    }
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}[${index}]`, String(index), depth + 1))
      return
    }
    if (isPlainObject(current)) {
      for (const [childKey, item] of Object.entries(current)) {
        visit(item, `${path}.${childKey}`, childKey, depth + 1)
        if (resources.length >= maxItems) return
      }
    }
  }

  function addStringResource(raw: string, path: string, key: string): void {
    const text = raw.trim()
    if (!text) return
    const kind = inferResourceKind(text, key)
    if (!kind) return
    const resolved = options.resolveUrl?.(text, { path, key, value: text, inferredKind: kind })
    const url = resolved || defaultResourceUrl(text)
    const id = `${kind}:${path}:${text}`
    if (seen.has(id)) return
    seen.add(id)
    resources.push({
      id,
      kind,
      label: key || path,
      value: text,
      url,
      path,
      previewable: Boolean(url && (kind === 'image' || kind === 'video')),
    })
  }
}

function inferResourceKind(value: string, key: string): ResourcePreviewKind | '' {
  const lowerValue = stripQuery(value).toLowerCase()
  const lowerKey = key.toLowerCase()
  if (hasExtension(lowerValue, imageExtensions)) {
    return 'image'
  }
  if (hasExtension(lowerValue, videoExtensions)) {
    return 'video'
  }
  if (isResourceLocator(value) && imageKeyPattern.test(lowerKey)) return 'image'
  if (isResourceLocator(value) && videoKeyPattern.test(lowerKey)) return 'video'
  if (looksLikeUrl(value) || looksLikePath(value)) return 'file'
  return ''
}

function defaultResourceUrl(value: string): string {
  if (value.startsWith('data:image/') || value.startsWith('data:video/')) return value
  if (looksLikeHttpUrl(value)) return value
  if (value.startsWith('//')) return `${globalThis.location?.protocol ?? 'https:'}${value}`
  if (value.startsWith('/')) return value
  if (looksLikePath(value) && !value.includes(':')) return `/${value.replace(/^\.?\//, '')}`
  return ''
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const text = value.trim()
  if (!text || (!text.startsWith('{') && !text.startsWith('['))) return value
  try {
    return JSON.parse(text) as unknown
  } catch {
    return value
  }
}

function stripQuery(value: string): string {
  return value.split(/[?#]/, 1)[0] ?? value
}

function hasExtension(value: string, extensions: string[]): boolean {
  return extensions.some((extension) => value.endsWith(extension))
}

function looksLikeHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function looksLikeUrl(value: string): boolean {
  return looksLikeHttpUrl(value) || value.startsWith('//') || value.startsWith('data:')
}

function looksLikePath(value: string): boolean {
  if (!filePathPattern.test(value) || /\s/.test(value)) return false
  return hasExtension(stripQuery(value).toLowerCase(), [...imageExtensions, ...videoExtensions])
}

function isResourceLocator(value: string): boolean {
  const text = value.trim()
  if (!text || /\s/.test(text)) return false
  return looksLikeUrl(text) || filePathPattern.test(text)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
