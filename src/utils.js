// created_at(ISO) → 'YYYY-MM-DD' 표시용
export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// 이미지 파일 유효성 (5MB, 이미지 타입)
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export function validateImage(file) {
  if (!file) return null
  if (!file.type.startsWith('image/')) return '이미지 파일만 업로드할 수 있습니다.'
  if (file.size > MAX_IMAGE_BYTES) return '이미지 크기는 5MB 이하여야 합니다.'
  return null
}
