import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../data'
import { boardApi } from '../api/board'
import { usePagedBoard } from '../hooks/usePagedBoard'
import PostRow from './PostRow'
import WriteForm from './WriteForm'
import DetailModal from './DetailModal'
import BannerSlider from './BannerSlider'

export default function Board() {
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('latest') // latest | views | replies
  const [writing, setWriting] = useState(false)

  const { rows, count, loading, loadingMore, error, live, signal, hasMore, loadMore, reload, mode } =
    usePagedBoard({ category: tab, query, sort })

  const viewedRef = useRef(new Set())
  const sentinelRef = useRef(null)

  // 선택된 글은 URL(/post/:id)에서 파생 — 딥링크/뒤로가기 지원
  const location = useLocation()
  const navigate = useNavigate()
  const routeMatch = location.pathname.match(/^\/post\/(\d+)/)
  const selectedId = routeMatch ? Number(routeMatch[1]) : null
  const openPost = (id) => navigate(`/post/${id}`)
  const closeModal = () => navigate('/')

  // 선택된 글: 로드된 목록에 있으면 사용, 없으면(딥링크) 단건 조회
  const [detailPost, setDetailPost] = useState(null)
  useEffect(() => {
    if (!selectedId) {
      setDetailPost(null)
      return
    }
    const inList = rows.find((p) => p.id === selectedId)
    if (inList) {
      setDetailPost(inList)
      return
    }
    let alive = true
    boardApi.getPost(selectedId).then((p) => alive && setDetailPost(p)).catch(() => {})
    return () => {
      alive = false
    }
  }, [selectedId, rows])

  // 모달 열림 동안 배경 스크롤 잠금 + 최초 열람 시 조회수 증가
  useEffect(() => {
    document.body.style.overflow = selectedId ? 'hidden' : ''
    if (selectedId && !viewedRef.current.has(selectedId)) {
      viewedRef.current.add(selectedId)
      boardApi.incrementViews(selectedId).then(() => reload()).catch(() => {})
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedId, reload])

  // 무한스크롤: 하단 센티넬이 보이면 다음 페이지 로드
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loadMore])

  function changeTab(key) {
    setTab(key)
  }

  async function handleCreate(data) {
    await boardApi.createPost(data)
    setWriting(false)
    setTab('all')
    setQuery('')
    setSort('latest')
    await reload()
  }

  async function handleUpdate(id, data, password) {
    await boardApi.updatePost(id, data, password)
    await reload()
  }

  async function handleDelete(id, password) {
    await boardApi.deletePost(id, password)
    closeModal()
    await reload()
  }

  async function handleAddComment(postId, data) {
    await boardApi.addComment(postId, data)
    await reload()
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
              {tab === c.key && !loading && <span className="tab__count">{count}</span>}
            </button>
          ))}
        </div>

        {/* 검색 + 정렬 */}
        <div className="toolbar">
          <label className="search">
            <span className="search__icon" aria-hidden>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
            데이터를 불러오지 못했습니다. <button className="text-link" onClick={reload}>다시 시도 →</button>
            <div className="board__error-detail">{error}</div>
          </div>
        ) : rows.length > 0 ? (
          <>
            <div className="board__list">
              {rows.map((p) => (
                <PostRow post={p} key={p.id} onOpen={() => openPost(p.id)} />
              ))}
            </div>

            {/* 무한스크롤 센티넬 + 상태 */}
            <div ref={sentinelRef} className="board__more">
              {loadingMore ? (
                <span className="body-sm">더 불러오는 중…</span>
              ) : hasMore ? (
                <button className="btn btn--outline btn--sm" onClick={loadMore}>더 보기</button>
              ) : (
                <span className="board__end">— 전체 {count}개 · 끝 —</span>
              )}
            </div>
          </>
        ) : (
          <div className="board__empty body-md">
            {query.trim() ? '검색 결과가 없습니다.' : '아직 게시글이 없습니다. 첫 글을 남겨보세요!'}
          </div>
        )}
      </div>

      {detailPost && (
        <DetailModal
          post={detailPost}
          signal={signal}
          onClose={closeModal}
          onAddComment={handleAddComment}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </section>
  )
}
