import { useCallback, useEffect, useRef, useState } from 'react'
import { boardApi } from '../api/board'

const PAGE_SIZE = 8

// 서버사이드 페이지네이션 + 무한스크롤 상태 관리
export function usePagedBoard({ category, query, sort }) {
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true) // 최초/조건변경 로드
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [live, setLive] = useState(false)
  const [signal, setSignal] = useState(0)

  const pageRef = useRef(1)
  const debounceRef = useRef(null)
  const liveTimer = useRef(null)

  const params = { category, query, sort }

  // 조건(카테고리/검색/정렬)에 맞춰 첫 페이지 로드
  const loadFirst = useCallback(async () => {
    setLoading(true)
    try {
      const { rows, count } = await boardApi.listPosts({ ...params, page: 1, pageSize: PAGE_SIZE })
      setRows(rows)
      setCount(count)
      setPage(1)
      pageRef.current = 1
      setError(null)
    } catch (e) {
      setError(e.message || '데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, query, sort])

  // 다음 페이지 추가 로드
  const loadMore = useCallback(async () => {
    if (loadingMore || loading) return
    if (rows.length >= count) return
    const next = pageRef.current + 1
    setLoadingMore(true)
    try {
      const res = await boardApi.listPosts({ ...params, page: next, pageSize: PAGE_SIZE })
      setRows((prev) => {
        // 중복 방지(id 기준 병합)
        const seen = new Set(prev.map((p) => p.id))
        return [...prev, ...res.rows.filter((r) => !seen.has(r.id))]
      })
      setCount(res.count)
      setPage(next)
      pageRef.current = next
    } catch (e) {
      setError(e.message || '더 불러오지 못했습니다.')
    } finally {
      setLoadingMore(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, loading, rows.length, count, category, query, sort])

  // 현재까지 로드된 범위를 통째로 다시 불러오기(실시간/작성 후 반영, 스크롤 유지)
  const reload = useCallback(async () => {
    const size = pageRef.current * PAGE_SIZE
    try {
      const { rows, count } = await boardApi.listPosts({ ...params, page: 1, pageSize: size })
      setRows(rows)
      setCount(count)
      setError(null)
    } catch {
      /* 조용히 무시 */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, query, sort])

  // 조건 변경 → 검색어는 디바운스
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(loadFirst, query ? 300 : 0)
    return () => clearTimeout(debounceRef.current)
  }, [loadFirst, query])

  // 실시간 구독 → 로드된 범위 재조회
  useEffect(() => {
    const onChange = () => {
      setLive(true)
      setSignal((s) => s + 1)
      reload()
      clearTimeout(liveTimer.current)
      liveTimer.current = setTimeout(() => setLive(false), 1200)
    }
    const unsub = boardApi.subscribe(onChange)
    return () => {
      clearTimeout(liveTimer.current)
      unsub?.()
    }
  }, [reload])

  const hasMore = rows.length < count

  return { rows, count, loading, loadingMore, error, live, signal, hasMore, loadMore, reload, mode: boardApi.MODE }
}
