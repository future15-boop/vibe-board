// ============================================================
//  데이터 접근 계층 (Data Access Layer)
//  컴포넌트는 이 모듈만 import 한다. 내부에서 Supabase / localStorage
//  둘 중 무엇을 쓸지 알아서 분기한다.
// ============================================================
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { localStore } from './localStore'

export const MODE = isSupabaseConfigured ? 'supabase' : 'local'

const POST_COLS =
  'id,category,title,author,content,tags,image_url,views,replies,pinned,created_at,user_id'

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

  // 서버사이드 필터 + 검색 + 정렬 + 페이지네이션
  // returns { rows, count } — count 는 필터에 걸린 전체 개수
  async listPosts({ category = 'all', query = '', sort = 'latest', page = 1, pageSize = 8 } = {}) {
    if (MODE === 'local') return localStore.listPosts({ category, query, sort, page, pageSize })

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    let q = supabase.from('posts').select(POST_COLS, { count: 'exact' })

    if (category !== 'all') q = q.eq('category', category)

    const s = query.trim().replace(/[,()%"{}*\\]/g, ' ').replace(/\s+/g, ' ').trim()
    if (s) {
      // 제목/작성자 부분검색(*=와일드카드) + (단일 토큰이면) 태그 정확일치
      const ors = [`title.ilike.*${s}*`, `author.ilike.*${s}*`]
      if (!s.includes(' ')) ors.push(`tags.cs.{${s}}`)
      q = q.or(ors.join(','))
    }

    const col = sort === 'views' ? 'views' : sort === 'replies' ? 'replies' : 'created_at'
    q = q.order('pinned', { ascending: false }).order(col, { ascending: false }).range(from, to)

    const { data, count, error } = await q
    if (error) throw new Error(error.message)
    return { rows: data, count: count ?? data.length }
  },

  // 단일 글 조회 (딥링크로 열었을 때 목록에 없을 수 있음)
  async getPost(id) {
    if (MODE === 'local') return localStore.getPost(id)
    const res = await supabase.from('posts').select(POST_COLS).eq('id', id).maybeSingle()
    if (res.error) throw new Error(res.error.message)
    return res.data
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
