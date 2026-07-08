// ============================================================
//  localStorage 폴백 스토어
//  Supabase 미설정 시 board.js 가 이 모듈을 사용한다.
//  브라우저에 영구 저장되고, 같은 API(Promise) 형태를 흉내낸다.
//  다른 탭 변경은 storage 이벤트로 "실시간"처럼 반영된다.
// ============================================================
import { POSTS, SEED_COMMENTS, CONTENT_BY_CATEGORY } from '../data'

const KEY = 'vibe-board.v1'
const listeners = new Set()

function today() {
  // 스크립트 환경 제약과 무관하게 브라우저에서는 정상 동작
  return new Date().toISOString().slice(0, 10)
}

function seed() {
  const posts = POSTS.map((p) => ({
    id: p.id,
    category: p.category,
    title: p.title,
    author: p.author,
    content: p.content || CONTENT_BY_CATEGORY[p.category] || '',
    tags: p.tags || [],
    image_url: null,
    views: p.views ?? 0,
    replies: p.replies ?? 0,
    pinned: !!p.pinned,
    created_at: `${p.date}T09:00:00.000Z`,
    _password: 'vibe1234', // 데모 비밀번호
  }))

  const comments = []
  let cid = 1
  for (const [postId, list] of Object.entries(SEED_COMMENTS)) {
    for (const c of list) {
      comments.push({
        id: cid++,
        post_id: Number(postId),
        author: c.author,
        text: c.text,
        created_at: `${c.date}T10:00:00.000Z`,
      })
    }
  }
  return { posts, comments, nextPostId: 1000, nextCommentId: cid }
}

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  const fresh = seed()
  write(fresh, false)
  return fresh
}

function write(db, notify = true) {
  localStorage.setItem(KEY, JSON.stringify(db))
  if (notify) listeners.forEach((fn) => fn())
}

// 반환 시 내부 필드(_password) 제거
function strip(post) {
  const { _password, ...rest } = post
  return rest
}

const delay = (v) => new Promise((res) => setTimeout(() => res(v), 120))

export const localStore = {
  async listPosts() {
    const db = read()
    return delay(db.posts.map(strip))
  },

  async createPost({ category, title, author, content, tags, imageDataUrl, password }) {
    if (!title?.trim() || !author?.trim()) throw new Error('제목과 작성자는 필수입니다.')
    if (!password || password.length < 4) throw new Error('비밀번호는 4자 이상이어야 합니다.')
    const db = read()
    const post = {
      id: db.nextPostId++,
      category: category || 'free',
      title: title.trim(),
      author: author.trim(),
      content: (content || '').trim(),
      tags: tags || [],
      image_url: imageDataUrl || null,
      views: 0,
      replies: 0,
      pinned: false,
      created_at: `${today()}T${new Date().toISOString().slice(11)}`,
      _password: password,
    }
    db.posts.unshift(post)
    write(db)
    return delay(strip(post))
  },

  async updatePost(id, { category, title, content, tags, imageDataUrl, removeImage }, password) {
    const db = read()
    const post = db.posts.find((p) => p.id === id)
    if (!post) throw new Error('게시글을 찾을 수 없습니다.')
    if (post._password !== password) throw new Error('비밀번호가 일치하지 않습니다.')
    if (category != null) post.category = category
    if (title != null) post.title = title.trim()
    if (content != null) post.content = content
    if (tags != null) post.tags = tags
    if (removeImage) post.image_url = null
    else if (imageDataUrl) post.image_url = imageDataUrl
    write(db)
    return delay(strip(post))
  },

  async deletePost(id, password) {
    const db = read()
    const post = db.posts.find((p) => p.id === id)
    if (!post) throw new Error('게시글을 찾을 수 없습니다.')
    if (post._password !== password) throw new Error('비밀번호가 일치하지 않습니다.')
    db.posts = db.posts.filter((p) => p.id !== id)
    db.comments = db.comments.filter((c) => c.post_id !== id)
    write(db)
    return delay()
  },

  async incrementViews(id) {
    const db = read()
    const post = db.posts.find((p) => p.id === id)
    if (post) {
      post.views += 1
      write(db)
    }
    return delay()
  },

  async listComments(postId) {
    const db = read()
    return delay(
      db.comments
        .filter((c) => c.post_id === postId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    )
  },

  async addComment(postId, { author, text }) {
    if (!author?.trim() || !text?.trim()) throw new Error('닉네임과 댓글 내용은 필수입니다.')
    const db = read()
    const comment = {
      id: db.nextCommentId++,
      post_id: postId,
      author: author.trim(),
      text: text.trim(),
      created_at: `${today()}T${new Date().toISOString().slice(11)}`,
    }
    db.comments.push(comment)
    const post = db.posts.find((p) => p.id === postId)
    if (post) post.replies += 1
    write(db)
    return delay(comment)
  },

  // "실시간" 구독 흉내: 같은 탭 변경 + 다른 탭 storage 이벤트
  subscribe(callback) {
    listeners.add(callback)
    const onStorage = (e) => {
      if (e.key === KEY) callback()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(callback)
      window.removeEventListener('storage', onStorage)
    }
  },
}
