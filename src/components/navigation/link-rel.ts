/**
 * 链接 target/rel 安全默认值的唯一决定位置。
 * 消费方（RRowActions、RRouteButton）不得各自内联 noopener/noreferrer。
 */

/** `_blank` 链接缺省必须携带的安全 rel。 */
export const LINK_BLANK_REL = 'noopener noreferrer'

/** 解析链接最终 rel；仅 `_blank` 需要安全默认值，其余交还调用方显式值。 */
export function resolveLinkRel(
  target: '_self' | '_blank' | undefined,
  explicitRel?: string,
): string | undefined {
  if (target === '_blank') return explicitRel ?? LINK_BLANK_REL
  return explicitRel
}
