# VIBE CODING BOARD — 서버리스 동적 게시판

React(Vite) + **Supabase(서버리스)** 기반 커뮤니티 게시판. BMW M 디자인 시스템 적용.

- 글/댓글이 **DB에 영구 저장**되고 **실시간(Realtime)** 으로 공유됩니다.
- 익명 작성 + **게시글 비밀번호**로 수정/삭제.
- 이미지 업로드(Supabase Storage), 조회수/댓글수 자동 증가.
- `.env` 미설정 시 **localStorage 데모 모드**로 즉시 실행됩니다.

## 아키텍처

```
React (Vite)                              Supabase (serverless)
  ├─ src/lib/supabase.js  ── client ───▶  posts / comments 테이블
  ├─ src/api/board.js     (데이터 계층)    RPC(create/update/delete/add_comment/increment_views)
  │    ├─ Supabase 모드                    Row Level Security (읽기 공개, 쓰기는 RPC만)
  │    └─ localStorage 폴백                post-images Storage 버킷
  ├─ src/hooks/useBoard.js (상태 + 실시간 구독)
  └─ src/components/*      (UI)
```

**보안 설계:** 모든 쓰기는 `SECURITY DEFINER` RPC를 통해서만 수행됩니다. 비밀번호는 DB에서 `crypt()`(bcrypt)로 해싱되어 저장되며, 해시는 클라이언트로 반환되지 않습니다. 클라이언트는 테이블에 직접 UPDATE/DELETE 할 수 없습니다(RLS).

## 빠른 시작 (데모 모드)

```bash
npm install
npm run dev
```

`.env`가 없으면 자동으로 localStorage 모드로 동작합니다. 상단 배지에 `LOCAL DEMO`로 표시됩니다.

## 실서버(Supabase) 연결

1. [supabase.com](https://supabase.com)에서 프로젝트 생성.
2. **SQL Editor**에서 [`supabase/schema.sql`](./supabase/schema.sql) 전체를 붙여넣고 **Run**.
   - 테이블 · RLS · RPC · Realtime · Storage 버킷이 한 번에 생성됩니다.
3. **Project Settings → API**에서 `Project URL`과 `anon public` 키 복사.
4. `.env.example`을 `.env`로 복사 후 값 입력:
   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
5. `npm run dev` 재시작 → 상단 배지가 `SUPABASE LIVE`로 바뀌면 성공.

> 두 브라우저 창을 나란히 띄우고 한쪽에서 글/댓글을 올려보세요. 다른 창에 **새로고침 없이** 반영됩니다(Realtime).

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리보기 |

## 배포

`dist/`는 정적 파일이므로 Vercel / Netlify / Cloudflare Pages 등에 그대로 올리면 됩니다.
빌드 환경변수에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 등록하세요.
백엔드는 Supabase가 서버리스로 처리하므로 별도 서버 운영이 필요 없습니다.
