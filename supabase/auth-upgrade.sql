-- ============================================================
--  업그레이드: Google 로그인(하이브리드) 지원
--  - posts/comments 에 user_id(auth.users) 추가
--  - password_hash 를 nullable 로 (로그인 사용자는 비번 불필요)
--  - create/update/delete_post 를 auth.uid() 기반 하이브리드로 개정
--    · 로그인 사용자: 본인(user_id=auth.uid()) 글이면 비번 없이 수정/삭제
--    · 비로그인: 기존처럼 게시글 비밀번호로 수정/삭제
--  → Supabase SQL Editor 에 전체 붙여넣고 Run. (재실행 안전)
-- ============================================================

-- 1) 컬럼 추가
alter table public.posts    add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.comments add column if not exists user_id uuid references auth.users(id) on delete set null;

-- 2) password_hash nullable 로 완화
alter table public.posts alter column password_hash drop not null;

create index if not exists posts_user_id_idx on public.posts(user_id);

-- 3) user_id 컬럼도 클라이언트가 읽을 수 있게 grant (password_hash 는 계속 제외)
grant select (id, category, title, author, content, tags, image_url,
              views, replies, pinned, created_at, user_id)
      on public.posts to anon, authenticated;

-- ------------------------------------------------------------
--  create_post (하이브리드)
-- ------------------------------------------------------------
create or replace function public.create_post(
  p_category text,
  p_title    text,
  p_author   text,
  p_content  text,
  p_tags     text[],
  p_image_url text,
  p_password text
)
returns public.posts
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_row public.posts;
  uid uuid := auth.uid();
  hash text;
begin
  if length(coalesce(p_title, '')) = 0 or length(coalesce(p_author, '')) = 0 then
    raise exception '제목과 작성자는 필수입니다.';
  end if;

  if uid is null then
    -- 비로그인: 비밀번호 필수
    if length(coalesce(p_password, '')) < 4 then
      raise exception '비밀번호는 4자 이상이어야 합니다.';
    end if;
    hash := crypt(p_password, gen_salt('bf'));
  else
    -- 로그인: 비밀번호 있으면 저장(선택), 없으면 소유권으로 관리
    hash := case when length(coalesce(p_password, '')) >= 4
                 then crypt(p_password, gen_salt('bf')) else null end;
  end if;

  insert into public.posts (category, title, author, content, tags, image_url, password_hash, user_id)
  values (
    coalesce(p_category, 'free'),
    p_title, p_author,
    coalesce(p_content, ''),
    coalesce(p_tags, '{}'),
    p_image_url, hash, uid
  )
  returning * into new_row;

  new_row.password_hash := null;
  return new_row;
end;
$$;

-- ------------------------------------------------------------
--  update_post (하이브리드 권한 검사)
-- ------------------------------------------------------------
create or replace function public.update_post(
  p_id       bigint,
  p_password text,
  p_category text,
  p_title    text,
  p_content  text,
  p_tags     text[],
  p_image_url text
)
returns public.posts
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  updated public.posts;
  stored  text;
  owner   uuid;
  uid     uuid := auth.uid();
begin
  select password_hash, user_id into stored, owner from public.posts where id = p_id;
  if not found then
    raise exception '게시글을 찾을 수 없습니다.';
  end if;

  if not (
    (uid is not null and owner = uid) or
    (stored is not null and crypt(p_password, stored) = stored)
  ) then
    raise exception '권한이 없습니다. (본인 글이 아니거나 비밀번호 불일치)';
  end if;

  update public.posts set
    category  = coalesce(p_category, category),
    title     = coalesce(p_title, title),
    content   = coalesce(p_content, content),
    tags      = coalesce(p_tags, tags),
    image_url = p_image_url
  where id = p_id
  returning * into updated;

  updated.password_hash := null;
  return updated;
end;
$$;

-- ------------------------------------------------------------
--  delete_post (하이브리드 권한 검사)
-- ------------------------------------------------------------
create or replace function public.delete_post(
  p_id       bigint,
  p_password text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  stored text;
  owner  uuid;
  uid    uuid := auth.uid();
begin
  select password_hash, user_id into stored, owner from public.posts where id = p_id;
  if not found then
    raise exception '게시글을 찾을 수 없습니다.';
  end if;

  if not (
    (uid is not null and owner = uid) or
    (stored is not null and crypt(p_password, stored) = stored)
  ) then
    raise exception '권한이 없습니다. (본인 글이 아니거나 비밀번호 불일치)';
  end if;

  delete from public.posts where id = p_id;
end;
$$;

-- ------------------------------------------------------------
--  add_comment (로그인 시 user_id 기록)
-- ------------------------------------------------------------
create or replace function public.add_comment(
  p_post_id bigint,
  p_author  text,
  p_text    text
)
returns public.comments
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_row public.comments;
begin
  if length(coalesce(p_author, '')) = 0 or length(coalesce(p_text, '')) = 0 then
    raise exception '닉네임과 댓글 내용은 필수입니다.';
  end if;

  insert into public.comments (post_id, author, text, user_id)
  values (p_post_id, p_author, p_text, auth.uid())
  returning * into new_row;

  update public.posts set replies = replies + 1 where id = p_post_id;
  return new_row;
end;
$$;

grant execute on function public.create_post(text,text,text,text,text[],text,text) to anon, authenticated;
grant execute on function public.update_post(bigint,text,text,text,text,text[],text) to anon, authenticated;
grant execute on function public.delete_post(bigint,text)                            to anon, authenticated;
grant execute on function public.add_comment(bigint,text,text)                       to anon, authenticated;
