import { defineComponent } from 'vue'
import type { ImageCropResult } from '@/components/image-crop-upload'

function createMockFile(name = 'cover.jpg', size = 1024, type = 'image/jpeg'): File {
  const blob = new Blob(['x'.repeat(size)], { type })
  return new File([blob], name, { type })
}

/**
 * RImageCropperDialog stub：确认时吐出固定裁切产物（cover-cropped.jpg），
 * 让上传链路测试可以不依赖 cropperjs 驱动“裁切 → 上传”。
 */
export const cropperDialogStub = defineComponent({
  name: 'RImageCropperDialog',
  props: {
    visible: { type: Boolean, required: true },
    file: { type: File, required: false },
    options: { type: Object, required: false },
  },
  emits: ['confirm', 'cancel', 'error', 'update:visible'],
  setup(props, { emit }) {
    function confirm(): void {
      const result: ImageCropResult = {
        file: createMockFile('cover-cropped.jpg', 512, 'image/jpeg'),
        sourceFile: props.file ?? createMockFile(),
        canvas: document.createElement('canvas'),
      }
      emit('confirm', result)
    }

    function cancel(): void {
      emit('cancel')
    }

    return { confirm, cancel }
  },
  template: `
    <div v-if="visible" data-testid="crop-dialog-stub">
      <button data-testid="crop-confirm-stub" @click="confirm">confirm</button>
      <button data-testid="crop-cancel-stub" @click="cancel">cancel</button>
    </div>
  `,
})

export function createImageCropSourceFile(name = 'cover-raw.jpg', type = 'image/jpeg'): File {
  return createMockFile(name, 1024, type)
}
