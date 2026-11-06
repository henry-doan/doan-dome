/**
 * Prepares a picture for a document: large photos are scaled down to
 * 1600 px wide and stored inside the document as a data URL, so they need
 * no server and keep working offline.
 */

const MAX_WIDTH = 1600
export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/gif,image/webp'

const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('That image couldn’t be opened.'))
    image.src = url
  })

const readAsDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

export const isImageFile = (file) => file?.type?.startsWith('image/')

/** Returns `{ src, alt, width, height }` ready for the image node. */
export const prepareImage = async (file) => {
  if (!isImageFile(file)) throw new Error('Choose a PNG, JPEG, GIF or WebP image.')
  const original = await readAsDataUrl(file)
  const image = await loadImage(original)
  const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')

  // GIFs keep their animation; small images are used as they are.
  if (file.type === 'image/gif' || image.naturalWidth <= MAX_WIDTH) {
    return { src: original, alt, width: image.naturalWidth, height: image.naturalHeight }
  }

  const scale = MAX_WIDTH / image.naturalWidth
  const canvas = document.createElement('canvas')
  canvas.width = MAX_WIDTH
  canvas.height = Math.round(image.naturalHeight * scale)
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  return { src: canvas.toDataURL(type, 0.88), alt, width: canvas.width, height: canvas.height }
}

/** Fits an image to the page's text width when it's wider. */
export const fitToWidth = ({ width, height }, maxWidth) => {
  if (!width || width <= maxWidth) return { width, height }
  return { width: Math.round(maxWidth), height: Math.round((height * maxWidth) / width) }
}
