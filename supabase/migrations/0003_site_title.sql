-- =====================================================================
-- 헤더 왼쪽 위에 보이는 사이트 이름 (비우면 이름을 그대로 쓴다)
-- Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여 넣고 Run 하세요. 여러 번 실행해도 안전합니다.
-- =====================================================================

alter table public.profile
  add column if not exists site_title text,
  add column if not exists site_title_en text;
