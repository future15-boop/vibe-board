-- ============================================================
--  VIBE CODING BOARD — Supabase schema
--  Supabase 대시보드 > SQL Editor 에 붙여넣고 [Run] 하세요.
--  (한 번만 실행하면 됩니다. 재실행해도 안전하도록 작성됨)
-- ============================================================

-- crypt() / gen_salt() 사용을 위한 확장
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
--  Tables
-- ------------------------------------------------------------
create table if not exists public.posts (
  id            bigint generated always as identity primary key,
  category      text        not null default 'free',
  title         text        not null,
  author        text        not null,
  content       text        not null default '',
  tags          text[]      not null default '{}',
  image_url     text,
  views         integer     not null default 0,
  replies       integer     not null default 0,
  pinned        boolean     not null default false,
  -- 익명 게시판: 글 작성 시 받은 비밀번호의 bcrypt 해시 (평문 저장 안 함)
  password_hash text        not null,
  created_at    timestamptz not null default now()
);

create table if not exists public.comments (
  id         bigint generated always as identity primary key,
  post_id    bigint      not null references public.posts(id) on delete cascade,
  author     text        not null,
  text       text        not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists posts_created_at_idx  on public.posts(created_at desc);

-- ------------------------------------------------------------
--  Row Level Security
--  읽기(SELECT)는 누구나 가능. 쓰기는 아래 RPC(SECURITY DEFINER)로만.
--  → 클라이언트가 직접 UPDATE/DELETE 하거나 password_hash 를
--    조작할 수 없게 막는다.
-- ------------------------------------------------------------
alter table public.posts    enable row level security;
alter table public.comments enable row level security;

drop policy if exists posts_select    on public.posts;
drop policy if exists comments_select on public.comments;

create policy posts_select    on public.posts    for select using (true);
create policy comments_select on public.comments for select using (true);
-- INSERT/UPDATE/DELETE 정책은 만들지 않음 → anon 직접 쓰기 차단.
-- (아래 RPC 는 SECURITY DEFINER 라 RLS 를 우회한다)

-- password_hash 컬럼이 SELECT 로 새어나가지 않도록 anon 권한에서 제외
revoke select on public.posts from anon, authenticated;
grant  select (id, category, title, author, content, tags, image_url,
               views, replies, pinned, created_at)
       on public.posts to anon, authenticated;

-- ------------------------------------------------------------
--  RPC: 글 작성 (비밀번호를 서버에서 해싱)
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
-- pgcrypto(gen_salt/crypt)는 Supabase에서 extensions 스키마에 설치되므로 포함
set search_path = public, extensions
as $$
declare
  new_row public.posts;
begin
  if length(coalesce(p_title, '')) = 0 or length(coalesce(p_author, '')) = 0 then
    raise exception '제목과 작성자는 필수입니다.';
  end if;
  if length(coalesce(p_password, '')) < 4 then
    raise exception '비밀번호는 4자 이상이어야 합니다.';
  end if;

  insert into public.posts (category, title, author, content, tags, image_url, password_hash)
  values (
    coalesce(p_category, 'free'),
    p_title, p_author,
    coalesce(p_content, ''),
    coalesce(p_tags, '{}'),
    p_image_url,
    crypt(p_password, gen_salt('bf'))
  )
  returning * into new_row;

  new_row.password_hash := null;  -- 해시는 반환하지 않음
  return new_row;
end;
$$;

-- ------------------------------------------------------------
--  RPC: 글 수정 (비밀번호 검증)
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
begin
  select password_hash into stored from public.posts where id = p_id;
  if stored is null then
    raise exception '게시글을 찾을 수 없습니다.';
  end if;
  if crypt(p_password, stored) <> stored then
    raise exception '비밀번호가 일치하지 않습니다.';
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
--  RPC: 글 삭제 (비밀번호 검증)
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
begin
  select password_hash into stored from public.posts where id = p_id;
  if stored is null then
    raise exception '게시글을 찾을 수 없습니다.';
  end if;
  if crypt(p_password, stored) <> stored then
    raise exception '비밀번호가 일치하지 않습니다.';
  end if;

  delete from public.posts where id = p_id;  -- comments 는 on delete cascade
end;
$$;

-- ------------------------------------------------------------
--  RPC: 댓글 작성 (replies 카운트 원자적 증가)
-- ------------------------------------------------------------
create or replace function public.add_comment(
  p_post_id bigint,
  p_author  text,
  p_text    text
)
returns public.comments
language plpgsql
security definer
set search_path = public
as $$
declare
  new_row public.comments;
begin
  if length(coalesce(p_author, '')) = 0 or length(coalesce(p_text, '')) = 0 then
    raise exception '닉네임과 댓글 내용은 필수입니다.';
  end if;

  insert into public.comments (post_id, author, text)
  values (p_post_id, p_author, p_text)
  returning * into new_row;

  update public.posts set replies = replies + 1 where id = p_post_id;
  return new_row;
end;
$$;

-- ------------------------------------------------------------
--  RPC: 조회수 증가
-- ------------------------------------------------------------
create or replace function public.increment_views(p_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts set views = views + 1 where id = p_id;
$$;

-- 실행 권한 부여 (anon 키로 호출 가능하게)
grant execute on function public.create_post(text,text,text,text,text[],text,text) to anon, authenticated;
grant execute on function public.update_post(bigint,text,text,text,text,text[],text) to anon, authenticated;
grant execute on function public.delete_post(bigint,text)                            to anon, authenticated;
grant execute on function public.add_comment(bigint,text,text)                       to anon, authenticated;
grant execute on function public.increment_views(bigint)                             to anon, authenticated;

-- ------------------------------------------------------------
--  Realtime: posts / comments 변경사항 브로드캐스트
-- ------------------------------------------------------------
-- 이미 추가된 경우 에러 없이 넘어가도록 (재실행 안전)
do $$
begin
  begin
    alter publication supabase_realtime add table public.posts;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.comments;
  exception when duplicate_object then null; end;
end $$;

-- ------------------------------------------------------------
--  Storage: 이미지 업로드 버킷 (public 읽기)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "post-images public read"   on storage.objects;
drop policy if exists "post-images anon upload"    on storage.objects;

create policy "post-images public read"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "post-images anon upload"
  on storage.objects for insert
  with check (bucket_id = 'post-images');

-- ------------------------------------------------------------
--  (선택) 시드 데이터 — 데모용 공지글. 비밀번호: vibe1234
--  필요 없으면 이 블록은 지워도 됩니다.
-- ------------------------------------------------------------
insert into public.posts (category, title, author, content, tags, pinned, views, replies, password_hash)
select 'notice', '[필독] 바이브코딩 커뮤니티에 오신 걸 환영합니다',
       'VIBE 운영팀',
       E'안녕하세요, VIBE CODING 운영팀입니다.\n\n서버리스 아키텍처로 새단장한 커뮤니티 게시판입니다. 글과 댓글이 이제 영구 저장되고 실시간으로 공유됩니다.\n\n자유롭게 글을 남겨주세요!',
       array['공지','환영'], true, 128, 0,
       crypt('vibe1234', gen_salt('bf'))
where not exists (select 1 from public.posts);
