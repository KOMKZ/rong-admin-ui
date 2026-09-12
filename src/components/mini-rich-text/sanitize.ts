const allowedTags = new Set([
  'A',
  'B',
  'BLOCKQUOTE',
  'BR',
  'DIV',
  'EM',
  'H2',
  'H3',
  'HR',
  'I',
  'IMG',
  'LI',
  'OL',
  'P',
  'SPAN',
  'STRONG',
  'U',
  'UL',
])

const blockFallbackTags = new Set(['ARTICLE', 'SECTION', 'MAIN', 'HEADER', 'FOOTER'])
const unsafeBlockPattern =
  /<(script|style|iframe|svg|table|thead|tbody|tr|td|th|video)[\s\S]*?<\/\1>/gi
const allowedStyleProps = new Set([
  'color',
  'background-color',
  'text-align',
  'width',
  'max-width',
  'height',
])

export function sanitizeMiniRichText(input: string): string {
  const stripped = input.replace(unsafeBlockPattern, '').trim()
  if (!stripped) return ''
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return stripped
  }
  const doc = new DOMParser().parseFromString(stripped, 'text/html')
  sanitizeChildren(doc.body)
  return normalizeEmpty(doc.body.innerHTML)
}

function sanitizeChildren(parent: ParentNode): void {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === Node.COMMENT_NODE) {
      child.remove()
      continue
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    sanitizeElement(child as HTMLElement)
  }
}

function sanitizeElement(element: HTMLElement): void {
  const tag = element.tagName
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'SVG') {
    element.remove()
    return
  }
  sanitizeChildren(element)
  if (!allowedTags.has(tag)) {
    unwrapOrReplace(element)
    return
  }
  for (const attr of Array.from(element.attributes)) {
    if (!isAllowedAttribute(element, attr.name, attr.value)) {
      element.removeAttribute(attr.name)
    }
  }
  if (tag === 'A') {
    element.setAttribute('target', '_blank')
    element.setAttribute('rel', 'noopener noreferrer')
  }
  if (tag === 'IMG') {
    element.setAttribute('loading', 'lazy')
  }
}

function unwrapOrReplace(element: HTMLElement): void {
  if (blockFallbackTags.has(element.tagName)) {
    const replacement = element.ownerDocument.createElement('div')
    replacement.innerHTML = element.innerHTML
    element.replaceWith(replacement)
    return
  }
  element.replaceWith(...Array.from(element.childNodes))
}

function isAllowedAttribute(element: HTMLElement, name: string, value: string): boolean {
  const normalized = name.toLowerCase()
  if (normalized.startsWith('on')) return false
  if (normalized === 'class') return true
  if (normalized === 'style') return sanitizeStyleAttribute(element, value)
  if (element.tagName === 'A' && normalized === 'href') return isSafeUrl(value)
  if (element.tagName === 'IMG') {
    return (
      (normalized === 'src' ||
        normalized === 'alt' ||
        normalized === 'title' ||
        normalized === 'width' ||
        normalized === 'height') &&
      (normalized !== 'src' || isSafeUrl(value))
    )
  }
  return false
}

function sanitizeStyleAttribute(element: HTMLElement, value: string): boolean {
  const safeStyles = value
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const [name = '', rawValue = ''] = part.split(':')
      const prop = name.trim().toLowerCase()
      const styleValue = rawValue.trim()
      if (!allowedStyleProps.has(prop)) return false
      if (/url\s*\(|expression\s*\(|javascript:/i.test(styleValue)) return false
      if ((prop === 'width' || prop === 'max-width') && element.tagName !== 'IMG') return false
      if (prop === 'height' && (element.tagName !== 'IMG' || styleValue !== 'auto')) return false
      if (prop === 'text-align' && !/^(left|center|right)$/i.test(styleValue)) return false
      return true
    })

  if (safeStyles.length === 0) {
    element.removeAttribute('style')
    return false
  }
  element.setAttribute('style', safeStyles.join('; '))
  return true
}

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim()
  return /^(https?:\/\/|\/)/i.test(trimmed)
}

function normalizeEmpty(value: string): string {
  return value.replace(/<p><br><\/p>/g, '').trim()
}
