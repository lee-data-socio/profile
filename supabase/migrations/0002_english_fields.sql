-- =====================================================================
-- 영문 페이지(/en, PRD P-10)용 컬럼 추가
-- 0001_init.sql 을 실행한 뒤, Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여 넣고 Run 하세요.
-- 여러 번 실행해도 안전합니다. RLS 정책과 view 는 바꾸지 않습니다.
--
-- /en 에는 영문 제목(주 필드)이 채워진 항목만 표시됩니다. 나머지 영문 필드는 비어 있으면 생략됩니다.
-- 논문 저자의 영문 이름은 publications.authors (jsonb) 안의 각 저자 name_en 에 저장하므로 컬럼이 필요 없습니다.
-- =====================================================================

alter table public.profile
  add column if not exists interests_en text[] not null default '{}';

alter table public.education
  add column if not exists advisor_en text;

alter table public.projects
  add column if not exists org_en text,
  add column if not exists funder_en text,
  add column if not exists role_en text,
  add column if not exists research_question_en jsonb,
  add column if not exists findings_en jsonb,
  add column if not exists methods_en text[] not null default '{}',
  add column if not exists data_sources_en text[] not null default '{}',
  add column if not exists tags_en text[] not null default '{}';

alter table public.publications
  add column if not exists venue_en text;

alter table public.experiences
  add column if not exists course_name_en text,
  add column if not exists semester_en text,
  add column if not exists supervisor_en text;

alter table public.entry_items
  add column if not exists metrics_en text[] not null default '{}';

alter table public.skills
  add column if not exists name_en text;

alter table public.awards
  add column if not exists org_en text,
  add column if not exists amount_en text,
  add column if not exists description_en text;

alter table public.activities
  add column if not exists org_en text,
  add column if not exists role_en text;

alter table public.attachments
  add column if not exists display_name_en text,
  add column if not exists description_en text;
