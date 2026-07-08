import { createClient } from '@supabase/supabase-js'

// Vite 환경변수 (.env 파일에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 두 값이 모두 있어야 실제 Supabase 모드로 동작.
// 없으면 board.js 가 localStorage 폴백 모드로 전환된다.
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  // 개발 편의: 콘솔에 한 번만 안내
  console.info(
    '%c[vibe-board] Supabase 미설정 → localStorage 데모 모드로 실행 중입니다.',
    'color:#1c69d4',
  )
  console.info('  실서버로 전환하려면 .env 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 를 설정하세요.')
}
