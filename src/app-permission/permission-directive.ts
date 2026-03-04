import type { Directive } from 'vue'
import type { PermissionDirectiveBinding, PermissionPolicy } from './types'

export function createPermissionDirective(
  policy: PermissionPolicy,
): Directive<HTMLElement, PermissionDirectiveBinding> {
  return {
    mounted(el, binding) {
      applyPermission(el, binding.value, policy)
    },
    updated(el, binding) {
      applyPermission(el, binding.value, policy)
    },
  }
}

function applyPermission(
  el: HTMLElement,
  binding: PermissionDirectiveBinding,
  policy: PermissionPolicy,
): void {
  if (!binding?.action) return

  const hasAccess = policy.hasPermission(binding.action)

  if (hasAccess) {
    el.removeAttribute('disabled')
    el.style.removeProperty('display')
    el.style.removeProperty('pointer-events')
    el.style.removeProperty('opacity')
    return
  }

  const effect = binding.effect ?? 'hidden'

  if (effect === 'disabled') {
    el.setAttribute('disabled', 'true')
    el.style.pointerEvents = 'none'
    el.style.opacity = '0.5'
  } else {
    el.style.display = 'none'
  }
}
