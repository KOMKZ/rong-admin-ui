import { onBeforeUnmount } from 'vue'
import type { AsyncTaskCenterInstance } from './types'

export function useAsyncTaskCenter(center: AsyncTaskCenterInstance): AsyncTaskCenterInstance {
  onBeforeUnmount(() => center.stop())
  return center
}
