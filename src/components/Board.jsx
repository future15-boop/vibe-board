import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES } from '../data'
import { boardApi } from '../api/board'
import { useBoard } from '../hooks/useBoard'
import PostRow from './PostRow'
import WriteForm from './WriteForm'
import DetailModal from './DetailModal'
import BannerSlider from './BannerSlider'

const PAGE_SIZE = 6

export default function Board() {
  const { posts, loading, error, live, signal, refresh, mode } = useBoard()

  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('latest') // latest | views | replies
  const [page, setPage] = useState(1)
  const [writing, setWriting] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const viewedRef = useRef(new Set())

  const selectedPost = posts.find((p) => p.id === selectedId) || null

  // 모달 열림 동안 배경 스크롤 잠금 + 최초 열람 시 조회수 증가
  useEffect(() => {
    document.body.style.overflow = selectedId ? 'hidden' : ''
    if (selectedId && !viewedRef.current.has(selectedId)) {
      viewedRef.current.add(selectedId)
      boardApi.incrementViews(selectedId).then(() => refresh({ silent: true })).catch(() => {})
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedId, refresh])

  // 카테고리별 개수
  const counts = useMemo(() => {
    const c = { all: posts.length }
    for (const p of posts) c[p.category] = (c[p.category] || 0) + 1
    return c
  }, [posts])

  // 필터 + 검색 + 정렬 (공지는 항상 상단 고정)
  const filtered = useMemo(() => {
    let list = posts.filter((p) => (tab === 'all' ? true : p.category === tab))
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)),
      )
    }
    const pinned = list.filter((p) => p.pinned)
    const rest = list.filter((p) => !p.pinned)
    rest.sort((a, b) => {
      if (sort === 'views') return b.views - a.views
      if (sort === 'replies') return b.replies - a.replies
      return new Date(b.created_at) - new Date(a.created_at) // latest
    })
    return [...pinned, ...rest]
  }, [posts, tab, query, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function changeTab(key) {
    setTab(key)
    setPage(1)
  }

  // WriteForm 이 await 하는 async 핸들러 (에러는 폼이 표시)
  async function handleCreate(data) {
    await boardApi.createPost(data)
    await refresh({ silent: true })
    setWriting(false)
    setTab('all')
    setPage(1)
  }

  async function handleUpdate(id, data, password) {
    await boardApi.updatePost(id, data, password)
    await refresh({ silent: true })
  }

  async function handleDelete(id, password) {
    await boardApi.deletePost(id, password)
    await refresh({ silent: true })
    setSelectedId(null)
  }

  async function handleAddComment(postId, data) {
    await boardApi.addComment(postId, data)
    await refresh({ silent: true })
  }

  return (
    <section className="board" id="board">
      <div className="wrap">
        <div className="board__head">
          <div>
            <span className="m-stripe--short" />
            <h2 className="display-lg board__title">Community</h2>
            <div className="board__status">
              <span className={`board__mode board__mode--${mode}`}>
                {mode === 'supabase' ? 'SUPABASE LIVE' : 'LOCAL DEMO'}
              </span>
              <span className={`board__live${live ? ' is-on' : ''}`}>● 실시간</span>
            </div>
          </div>
          <button className="btn btn--light" onClick={() => setWriting((w) => !w)}>
            {writing ? '닫기' : '글쓰기'} <span className="btn__arrow">＋</span>
          </button>
        </div>

        {writing && (
          <WriteForm onSubmit={handleCreate} onCancel={() => setWriting(false)} />
        )}

        {/* 전체(All) 탭이 활성화된 경우에만 Swiper 배너 노출 */}
        {tab === 'all' && <BannerSlider />}

        {/* 카테고리 탭 */}
        <div className="tabs" role="tablist">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className="tab"
              role="tab"
              data-active={tab === c.key}
              onClick={() => changeTab(c.key)}
            >
              {c.label}
              <span className="tab__count">{counts[c.key] || 0}</span>
            </button>
          ))}
        </div>

        {/* 검색 + 정렬 */}
        <div className="toolbar">
          <label className="search">
            <span className="search__icon" aria-hidden>⌕</span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="제목, 작성자, 태그로 검색"
            />
          </label>
          <div className="sort">
            <button data-active={sort === 'latest'} onClick={() => setSort('latest')}>최신</button>
            <button data-active={sort === 'views'} onClick={() => setSort('views')}>조회순</button>
            <button data-active={sort === 'replies'} onClick={() => setSort('replies')}>댓글순</button>
          </div>
        </div>

        {/* 목록 / 로딩 / 에러 */}
        {loading ? (
          <div className="board__empty body-md">불러오는 중…</div>
        ) : error ? (
          <div className="board__empty body-md board__error">
            데이터를 불러오지 못했습니다. <button className="text-link" onClick={() => refresh()}>다시 시도 →</button>
            <div className="board__error-detail">{error}</div>
          </div>
        ) : paged.length > 0 ? (
          <div className="board__list">
            {paged.map((p) => (
              <PostRow post={p} key={p.id} onOpen={() => setSelectedId(p.id)} />
            ))}
          </div>
        ) : (
          <div className="board__empty body-md">
            {query.trim() ? '검색 결과가 없습니다.' : '아직 게시글이 없습니다. 첫 글을 남겨보세요!'}
          </div>
        )}

        {/* 페이지네이션 */}
        {!loading && !error && totalPages > 1 && (
          <div className="pager">
            <button disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} data-active={n === safePage} onClick={() => setPage(n)}>
                {n}
              </button>
            ))}
            <button disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>›</button>
          </div>
        )}
      </div>

      {selectedPost && (
        <DetailModal
          post={selectedPost}
          signal={signal}
          onClose={() => setSelectedId(null)}
          onAddComment={handleAddComment}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </section>
  )
}
