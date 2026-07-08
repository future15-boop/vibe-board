import { useCallback, useEffect, useRef, useState } from 'react'
import { boardApi } from '../api/board'

// 게시글 목록 로딩 + 실시간 구독을 관리하는 훅
export function useBoard() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [live, setLive] = useState(false) // 실시간 반영 표시용
  const [signal, setSignal] = useState(0) // 변경 발생 시 증가 (하위 컴포넌트 refetch 트리거)
  const debounceRef = useRef(null)

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      const list = await boardApi.listPosts()
      setPosts(list)
      setError(null)
    } catch (e) {
      setError(e.message || '데이터를 불러오지 못했습니다.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()

    // 변경 이벤트 → 짧게 디바운스 후 조용히 새로고침
    const onChange = () => {
      setLive(true)
      setSignal((s) => s + 1)
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        refresh({ silent: true })
        setTimeout(() => setLive(false), 1200)
      }, 250)
    }

    const unsubscribe = boardApi.subscribe(onChange)
    return () => {
      clearTimeout(debounceRef.current)
      unsubscribe?.()
    }
  }, [refresh])

  return { posts, setPosts, loading, error, live, signal, refresh, mode: boardApi.MODE }
}
