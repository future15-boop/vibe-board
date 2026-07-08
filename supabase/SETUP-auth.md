# Google 로그인 설정 가이드

이 문서대로 하면 게시판에 Google 로그인이 켜집니다. **순서가 중요합니다.**

---

## ① (필수·배포 전) DB 마이그레이션 실행

Supabase 대시보드 → **SQL Editor** → 아래 파일 전체 붙여넣고 **Run**:

```
supabase/auth-upgrade.sql
```

- `posts`/`comments`에 `user_id` 컬럼 추가, 하이브리드 수정/삭제 RPC로 교체
- 이걸 먼저 하지 않으면, 새 프론트엔드가 `user_id`를 조회하다 오류가 납니다.

> 이 단계까지만 하면 로그인 UI 없이도 사이트는 정상 동작합니다(비로그인/비밀번호 모드).

---

## ② Google OAuth 앱 만들기 (Google Cloud Console)

1. https://console.cloud.google.com → 프로젝트 생성(또는 선택)
2. **APIs & Services → OAuth consent screen** → External → 앱 이름/이메일 입력 후 저장
   - 테스트 단계면 **Test users**에 본인 Gmail 추가
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized redirect URIs**에 아래 추가 (본인 Supabase 프로젝트 주소):
     ```
     https://<프로젝트REF>.supabase.co/auth/v1/callback
     ```
     (`<프로젝트REF>`는 Supabase 대시보드 Project Settings → API 의 Project URL 앞부분)
4. 생성 후 **Client ID**와 **Client Secret** 복사

---

## ③ Supabase에 Google provider 등록

1. Supabase 대시보드 → **Authentication → Sign In / Providers → Google**
2. **Enable** 켜고 ②에서 받은 **Client ID / Client Secret** 붙여넣기 → Save

---

## ④ 리다이렉트 URL 허용 (Supabase)

Supabase → **Authentication → URL Configuration**

- **Site URL**: `https://vibe-board-jade.vercel.app`
- **Redirect URLs** (여러 개 추가):
  ```
  http://localhost:5173
  http://localhost:5174
  http://localhost:5175
  https://vibe-board-jade.vercel.app
  ```

---

## 완료 확인

- 사이트 우상단 **"Google 로그인"** 클릭 → Google 계정 선택 → 돌아오면 이름/아바타 표시
- 로그인 상태로 글 작성 → 그 글 상세에 **"내 글"** 배지 + 비밀번호 없이 수정/삭제 가능
- 비로그인 사용자는 기존처럼 **비밀번호**로 작성/수정/삭제 (하이브리드)

문제 시: Google 로그인 후 `redirect_uri_mismatch` 오류가 나면 ②의 redirect URI와 ④의 Redirect URLs를 다시 확인하세요.
