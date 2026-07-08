import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!isSupabaseConfigured) // 미설정이면 즉시 ready(비로그인)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let alive = true

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setUser(data.session?.user ?? null)
      setReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      alive = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  async function signInWithGoogle() {
    if (!isSupabaseConfigured) {
      alert('데모(localStorage) 모드에서는 로그인을 사용할 수 없습니다. Supabase 연결 후 이용하세요.')
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) alert(`로그인 실패: ${error.message}`)
  }

  async function signOut() {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    setUser(null)
  }

  // 표시용 프로필 (Google 메타데이터)
  const profile = user
    ? {
        id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
        avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        email: user.email,
      }
    : null

  return (
    <AuthContext.Provider value={{ user, profile, ready, signInWithGoogle, signOut, enabled: isSupabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
