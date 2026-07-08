-- ============================================================
--  패치: pgcrypto(gen_salt/crypt) search_path 수정
--  증상: create_post 호출 시 "function gen_salt(unknown) does not exist"
--  원인: Supabase는 pgcrypto를 extensions 스키마에 설치하는데
--        함수 search_path 가 public 로만 고정돼 있었음.
--  → SQL Editor 에 이 파일 전체를 붙여넣고 Run 하세요. (안전하게 재실행 가능)
-- ============================================================

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

  new_row.password_hash := null;
  return new_row;
end;
$$;

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

  delete from public.posts where id = p_id;
end;
$$;

grant execute on function public.create_post(text,text,text,text,text[],text,text) to anon, authenticated;
grant execute on function public.update_post(bigint,text,text,text,text,text[],text) to anon, authenticated;
grant execute on function public.delete_post(bigint,text)                            to anon, authenticated;
