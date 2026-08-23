# RImageCropUpload 图片裁切上传

`RImageCropUpload` 是面向头像、封面、文章图片等图片场景的组合上传组件。组件内部复用 `RProUpload` 的 storage 上传协议，只在文件入队前增加图片裁切、Canvas 输出和 `File` 转换。

## 场景

- 管理员头像：固定 1:1，输出 256 x 256。
- 封面图片：固定 16:9 或 4:3。
- 业务图片：上传前统一转换为 jpeg/png/webp。

不适合：

- 文档、导出文件、非图片附件。
- 需要多图层编辑、滤镜、水印模板的复杂图片编辑器。

## 基础用法

```vue
<RImageCropUpload
  v-model="files"
  storage="avatar"
  business-type="admin_avatar"
  accept="image/jpeg,image/png,image/webp"
  :max-count="1"
  :max-size-m-b="5"
  :headers="headers"
  :crop-options="{
    aspectRatio: 1,
    cropBoxWidth: 360,
    cropBoxHeight: 360,
    outputWidth: 256,
    outputHeight: 256,
    outputType: 'image/jpeg',
    outputQuality: 0.9,
    circularPreview: true,
  }"
/>
```

## Props

继承 `RProUpload` 的上传 props，并额外支持：

| 属性          | 类型                       | 默认值 | 说明                               |
| ------------- | -------------------------- | ------ | ---------------------------------- |
| `crop`        | `boolean`                  | `true` | 是否对图片文件打开裁切弹窗         |
| `cropOptions` | `ImageCropOptions`         | `{}`   | 裁切比例、输出尺寸、输出类型等配置 |
| `cropLocale`  | `Partial<ImageCropLocale>` | `{}`   | 裁切弹窗文案覆盖                   |

`cropOptions.cropBoxWidth` 和 `cropOptions.cropBoxHeight` 控制弹窗里的固定裁切框显示尺寸，
`outputWidth` 和 `outputHeight` 控制最终导出文件的像素尺寸。裁切框默认固定居中，
用户通过拖动底图、缩放底图和方向微调按钮完成头像对齐。

## Events

继承 `RProUpload` 的上传事件，并额外支持：

| 事件           | 参数              | 说明                                         |
| -------------- | ----------------- | -------------------------------------------- |
| `crop-success` | `ImageCropResult` | 用户确认裁切并生成文件后触发                 |
| `crop-cancel`  | `File`            | 用户取消裁切时触发，当前文件不会进入上传队列 |
| `crop-error`   | `Error`           | 图片校验或 Canvas 输出失败时触发             |

## 上传流程

```text
选择文件
  -> RProUpload accept/maxSize/maxCount 校验
  -> RImageCropperDialog 裁切
  -> canvas.toBlob()
  -> new File()
  -> RProUpload 队列
  -> storage FormData 上传
  -> parseResponse 回填 storageId/url
```

## 可访问性

- 裁切弹窗使用 modal dialog 语义。
- 弹窗启用焦点陷阱和 Escape 关闭。
- 工具按钮均有 `aria-label` 和稳定 `data-testid`。
- 上传触发区、文件项和预览沿用 `RProUpload` 的键盘路径。

## 样式

组件样式只使用 `--ra-*` 语义 token。第三方 `cropperjs` 实例被封装在弹窗内部，业务应用不需要直接引入第三方样式或 API。
