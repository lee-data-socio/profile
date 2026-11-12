-- =====================================================================
-- 이력서 사이트 초기 스키마
-- Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여 넣고 Run 하세요.
-- 여러 번 실행해도 안전하도록(idempotent) 작성했습니다.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 공통: updated_at 자동 갱신
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 프로필 (1행)
-- ---------------------------------------------------------------------
create table if not exists public.profile (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  name text not null default '이름',
  name_en text,
  headline text,
  headline_en text,
  bio jsonb,
  bio_en jsonb,
  interests text[] not null default '{}',
  contacts jsonb not null default '{}'::jsonb,
  photo_path text,
  cv_attachment_id uuid,
  section_order jsonb not null default '[]'::jsonb,
  visibility text not null default 'public' check (visibility in ('draft','public','private')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.profile (singleton) values (true) on conflict (singleton) do nothing;

-- ---------------------------------------------------------------------
-- 연구 관심사
-- ---------------------------------------------------------------------
create table if not exists public.research_interests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_en text,
  description text,
  description_en text,
  project_ids uuid[] not null default '{}',
  publication_ids uuid[] not null default '{}',
  visibility text not null default 'draft' check (visibility in ('draft','public','private')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 학력
-- ---------------------------------------------------------------------
create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  school text not null,
  school_en text,
  major text not null,
  major_en text,
  degree text not null,
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  status text not null default '재학',
  advisor text,
  thesis_title text,
  thesis_title_en text,
  visibility text not null default 'draft' check (visibility in ('draft','public','private')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint education_dates check (end_date is null or end_date >= start_date)
);

-- ---------------------------------------------------------------------
-- 연구 프로젝트
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  title_en text,
  summary text,
  summary_en text,
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  org text,
  funder text,
  role text,
  approach text check (approach is null or approach in ('quantitative','qualitative','mixed')),
  research_question jsonb,
  methods text[] not null default '{}',
  data_sources text[] not null default '{}',
  findings jsonb,
  tools text[] not null default '{}',
  tags text[] not null default '{}',
  visibility text not null default 'draft' check (visibility in ('draft','public','private')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_dates check (end_date is null or end_date >= start_date)
);

-- ---------------------------------------------------------------------
-- 논문·학술발표
-- ---------------------------------------------------------------------
create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  type text not null check (type in ('journal','thesis','conference','report','working_paper','book_chapter')),
  authors jsonb not null default '[]'::jsonb,
  title text not null,
  title_en text,
  venue text,
  volume text,
  issue text,
  pages text,
  year int check (year is null or (year between 1900 and 2100)),
  pub_status text not null default 'published'
    check (pub_status in ('published','accepted','under_review','in_preparation','presented')),
  doi text,
  url text,
  abstract text,
  abstract_en text,
  project_id uuid references public.projects(id) on delete set null,
  visibility text not null default 'draft' check (visibility in ('draft','public','private')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 경력 · 교육 경력 (type 으로 구분)
-- ---------------------------------------------------------------------
create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  org text not null,
  org_en text,
  title text not null,
  title_en text,
  type text not null check (type in ('RA','TA','intern','job','lecture','other')),
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  description text,
  description_en text,
  course_name text,
  semester text,
  supervisor text,
  visibility text not null default 'draft' check (visibility in ('draft','public','private')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiences_dates check (end_date is null or end_date >= start_date)
);

-- ---------------------------------------------------------------------
-- 업무 항목 (사실 단위)
-- ---------------------------------------------------------------------
create table if not exists public.entry_items (
  id uuid primary key default gen_random_uuid(),
  parent_type text not null check (parent_type in ('project','experience')),
  parent_id uuid not null,
  text text not null,
  text_en text,
  metrics text[] not null default '{}',
  evidence_url text,
  tags text[] not null default '{}',
  last_used date,
  visibility text not null default 'public' check (visibility in ('draft','public','private')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists entry_items_parent_idx on public.entry_items (parent_type, parent_id);

-- ---------------------------------------------------------------------
-- 역량
-- ---------------------------------------------------------------------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('quantitative','qualitative','survey_design','tool','language')),
  description text,
  description_en text,
  visibility text not null default 'draft' check (visibility in ('draft','public','private')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 수상·장학·연구비 / 학술활동
-- ---------------------------------------------------------------------
create table if not exists public.awards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  org text,
  year int check (year is null or (year between 1900 and 2100)),
  amount text,
  description text,
  visibility text not null default 'draft' check (visibility in ('draft','public','private')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  org text,
  role text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  visibility text not null default 'draft' check (visibility in ('draft','public','private')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_dates check (end_date is null or start_date is null or end_date >= start_date)
);

-- ---------------------------------------------------------------------
-- 첨부파일
-- ---------------------------------------------------------------------
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('project','publication','experience','profile')),
  entity_id uuid not null,
  storage_path text not null unique,
  display_name text not null,
  original_name text not null,
  description text,
  kind text not null default 'other'
    check (kind in ('paper','report','slides','poster','questionnaire','codebook','cv','other')),
  mime text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  visibility text not null default 'private' check (visibility in ('draft','public','private')),
  version_type text check (version_type is null or version_type in ('published','preprint')),
  ethics_checked boolean not null check (ethics_checked),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists attachments_entity_idx on public.attachments (entity_type, entity_id);

-- ---------------------------------------------------------------------
-- 비공개 파일 공유 링크 (F-12, 2차)
-- ---------------------------------------------------------------------
create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  attachment_id uuid not null references public.attachments(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  expires_at timestamptz not null default now() + interval '7 days',
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 변경 이력 (append-only)
-- ---------------------------------------------------------------------
create table if not exists public.change_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_id uuid,
  op text not null,
  before jsonb,
  after jsonb,
  changed_at timestamptz not null default now()
);

create or replace function public.log_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.change_log (table_name, row_id, op, before, after)
  values (
    tg_table_name,
    coalesce((case when tg_op = 'DELETE' then old.id else new.id end), null),
    tg_op,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return null;
end;
$$;

create or replace function public.change_log_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'change_log is append-only';
end;
$$;

drop trigger if exists change_log_no_mutation on public.change_log;
create trigger change_log_no_mutation
  before update or delete on public.change_log
  for each row execute function public.change_log_append_only();

-- 트리거 일괄 부착
do $$
declare
  t text;
begin
  foreach t in array array[
    'profile','research_interests','education','projects','publications',
    'experiences','entry_items','skills','awards','activities','attachments'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
    execute format('drop trigger if exists log_change on public.%I', t);
    execute format('create trigger log_change after insert or update or delete on public.%I
                    for each row execute function public.log_change()', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- RLS: 익명·로그인 사용자는 visibility = 'public' 만 읽기, 쓰기 정책 없음.
-- 관리자 쓰기는 서버(service role)에서만 수행합니다.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profile','research_interests','education','projects','publications',
    'experiences','skills','awards','activities'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated
                    using (visibility = ''public'')', t);
  end loop;
end;
$$;

-- 부모 항목이 공개 상태인지 (호출자 권한으로 실행되므로 RLS가 그대로 적용됨)
create or replace function public.entity_is_public(p_type text, p_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select case p_type
    when 'project'     then exists (select 1 from public.projects     where id = p_id and visibility = 'public')
    when 'publication' then exists (select 1 from public.publications where id = p_id and visibility = 'public')
    when 'experience'  then exists (select 1 from public.experiences  where id = p_id and visibility = 'public')
    when 'profile'     then exists (select 1 from public.profile      where id = p_id and visibility = 'public')
    else false
  end;
$$;

alter table public.entry_items enable row level security;
drop policy if exists "public read" on public.entry_items;
create policy "public read" on public.entry_items for select to anon, authenticated
  using (visibility = 'public' and public.entity_is_public(parent_type, parent_id));

alter table public.attachments enable row level security;
drop policy if exists "public read" on public.attachments;
create policy "public read" on public.attachments for select to anon, authenticated
  using (visibility = 'public' and public.entity_is_public(entity_type, entity_id));

-- 공유 링크·변경 이력은 정책 없음 = service role 외 접근 불가
alter table public.share_links enable row level security;
alter table public.change_log enable row level security;

-- ---------------------------------------------------------------------
-- 역량 근거 집계 view (태그 기반)
-- security_invoker 이므로 익명 사용자에게는 공개 항목만 집계됩니다.
-- ---------------------------------------------------------------------
drop view if exists public.skill_stats;
create view public.skill_stats with (security_invoker = true) as
with usages as (
  select distinct
    'project:' || p.id::text as source,
    lower(trim(t)) as tag,
    p.start_date as started_on,
    case when p.is_current then current_date else coalesce(p.end_date, p.start_date) end as used_on
  from public.projects p
  cross join lateral unnest(p.tools || p.tags || p.methods) as t
  union
  select distinct
    'item:' || ei.id::text,
    lower(trim(t)),
    coalesce(pp.start_date, ex.start_date),
    coalesce(
      ei.last_used,
      case when coalesce(pp.is_current, ex.is_current) then current_date
           else coalesce(pp.end_date, ex.end_date, pp.start_date, ex.start_date) end
    )
  from public.entry_items ei
  left join public.projects pp on ei.parent_type = 'project' and pp.id = ei.parent_id
  left join public.experiences ex on ei.parent_type = 'experience' and ex.id = ei.parent_id
  cross join lateral unnest(ei.tags) as t
  where (pp.id is not null or ex.id is not null)
)
select
  s.id,
  s.name,
  s.category,
  count(distinct u.source)::int as evidence_count,
  min(u.started_on) as first_used,
  max(u.used_on) as last_used
from public.skills s
left join usages u on u.tag = lower(trim(s.name))
group by s.id, s.name, s.category;

-- ---------------------------------------------------------------------
-- 사이트 마지막 업데이트 시각 view
-- ---------------------------------------------------------------------
drop view if exists public.site_last_updated;
create view public.site_last_updated with (security_invoker = true) as
select greatest(
  (select max(updated_at) from public.profile),
  (select max(updated_at) from public.research_interests),
  (select max(updated_at) from public.education),
  (select max(updated_at) from public.projects),
  (select max(updated_at) from public.publications),
  (select max(updated_at) from public.experiences),
  (select max(updated_at) from public.entry_items),
  (select max(updated_at) from public.skills),
  (select max(updated_at) from public.awards),
  (select max(updated_at) from public.activities),
  (select max(updated_at) from public.attachments)
) as last_updated;

grant select on public.skill_stats, public.site_last_updated to anon, authenticated;

-- ---------------------------------------------------------------------
-- Storage 버킷
--   attachments: 비공개. 서버가 발급한 서명 URL로만 업로드·다운로드.
--   avatars    : 공개. 프로필 사진 전용.
-- storage.objects 에 정책을 만들지 않으므로 익명 접근은 모두 거부됩니다.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
