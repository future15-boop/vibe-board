// ============================================================
//  데이터 접근 계층 (Data Access Layer)
//  컴포넌트는 이 모듈만 import 한다. 내부에서 Supabase / localStorage
//  둘 중 무엇을 쓸지 알아서 분기한다.
// ============================================================
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { localStore } from './localStore'

export const MODE = isSupabaseConfigured ? 'supabase' : 'local'

const POST_COLS =
  'id,category,title,author,content,tags,image_url,views,replies,pinned,created_at'

// File → data URL (localStorage 폴백에서 이미지 저장용)
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Supabase Storage 업로드 → public URL
async function uploadImage(file) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const rand = Math.random().toString(36).slice(2)
  const path = `${Date.now()}-${rand}.${ext}`
  const { error } = await supabase.storage
    .from('post-images')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw new Error(`이미지 업로드 실패: ${error.message}`)
  const { data } = supabase.storage.from('post-images').getPublicUrl(path)
  return data.publicUrl
}

function unwrap({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

export const boardApi = {
  MODE,

  async listPosts() {
    if (MODE === 'local') return localStore.listPosts()
    const res = await supabase
      .from('posts')
      .select(POST_COLS)
      .order('created_at', { ascending: false })
    return unwrap(res)
  },

  async listComments(postId) {
    if (MODE === 'local') return localStore.listComments(postId)
    const res = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    return unwrap(res)
  },

  async createPost({ category, title, author, content, tags, imageFile, password }) {
    if (MODE === 'local') {
      const imageDataUrl = imageFile ? await fileToDataUrl(imageFile) : null
      return localStore.createPost({ category, title, author, content, tags, imageDataUrl, password })
    }
    const image_url = imageFile ? await uploadImage(imageFile) : null
    const res = await supabase.rpc('create_post', {
      p_category: category,
      p_title: title,
      p_author: author,
      p_content: content,
      p_tags: tags,
      p_image_url: image_url,
      p_password: password,
    })
    return unwrap(res)
  },

  async updatePost(id, { category, title, content, tags, imageFile, removeImage, currentImageUrl }, password) {
    if (MODE === 'local') {
      const imageDataUrl = imageFile ? await fileToDataUrl(imageFile) : null
      return localStore.updatePost(id, { category, title, content, tags, imageDataUrl, removeImage }, password)
    }
    let image_url = currentImageUrl ?? null
    if (removeImage) image_url = null
    else if (imageFile) image_url = await uploadImage(imageFile)
    const res = await supabase.rpc('update_post', {
      p_id: id,
      p_password: password,
      p_category: category,
      p_title: title,
      p_content: content,
      p_tags: tags,
      p_image_url: image_url,
    })
    return unwrap(res)
  },

  async deletePost(id, password) {
    if (MODE === 'local') return localStore.deletePost(id, password)
    const res = await supabase.rpc('delete_post', { p_id: id, p_password: password })
    return unwrap(res)
  },

  async addComment(postId, { author, text }) {
    if (MODE === 'local') return localStore.addComment(postId, { author, text })
    const res = await supabase.rpc('add_comment', {
      p_post_id: postId,
      p_author: author,
      p_text: text,
    })
    return unwrap(res)
  },

  async incrementViews(id) {
    if (MODE === 'local') return localStore.incrementViews(id)
    const res = await supabase.rpc('increment_views', { p_id: id })
    if (res.error) throw new Error(res.error.message)
  },

  // 변경 구독 → cleanup 함수 반환
  subscribe(callback) {
    if (MODE === 'local') return localStore.subscribe(callback)
    const channel = supabase
      .channel('board-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, callback)
      .subscribe()
    return () => supabase.removeChannel(channel)
  },
}
