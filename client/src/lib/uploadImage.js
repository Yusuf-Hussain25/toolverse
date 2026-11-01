// Uploads go through the API, and serverless hosts cap a request at 4.5 MB. The server resizes
// every image to 2048 px anyway, so big photos are scaled down in the browser first: same result,
// smaller upload. Small images are sent untouched.
const MAX_SIDE = 2048
const SEND_AS_IS_BYTES = 3 * 1024 * 1024

export const prepareImage = async (file) => {
  if (file.size <= SEND_AS_IS_BYTES) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    // WebP keeps transparency and stays well under the limit at this size
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.92))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' })
  } catch {
    return file // the browser can't decode it; let the server decide
  }
}
