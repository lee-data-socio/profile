# 개인 연구·이력 사이트

사회학 대학원생의 연구, 경력, 포트폴리오를 보여 주는 사이트입니다. 내용은 코드 수정 없이 `/admin` 에서 입력하고, 저장하면 재배포 없이 공개 페이지에 바로 반영됩니다. 요구사항은 `이력서 사이트 PRD.md` 를 참고하세요.

- **스택**: Next.js 16 (App Router, Cache Components) · Supabase (PostgreSQL, Auth, Storage) · Tailwind CSS 4 · Tiptap · Vercel
- **공개 페이지**: `/` 홈, `/projects` 프로젝트 목록·상세, `/publications` 논문·발표 목록·상세
- **관리자**: `/admin` (이메일 매직링크 로그인, `OWNER_EMAIL` 한 명만)

---

## 1. Supabase 준비 (10분)

1. <https://supabase.com> 에서 새 프로젝트를 만듭니다. Region 은 `Northeast Asia (Seoul)` 을 권장합니다.
2. 왼쪽 **SQL Editor** → New query → `supabase/migrations/0001_init.sql` 내용을 전부 붙여 넣고 **Run**.
   테이블, RLS 정책, 역량 집계 view, Storage 버킷(`attachments` 비공개, `avatars` 공개)이 만들어집니다. 여러 번 실행해도 안전합니다.
3. **Project Settings → API Keys** 에서 키 두 개를 복사해 둡니다.
   - `anon` / `publishable` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` / `secret` 키 → `SUPABASE_SERVICE_ROLE_KEY` (**절대 공개 금지**)
   - Project URL (`https://xxxx.supabase.co`) → `NEXT_PUBLIC_SUPABASE_URL`
4. **Authentication → URL Configuration**
   - Site URL: 우선 `http://localhost:3000` (배포 후 Vercel 주소로 바꿉니다)
   - Redirect URLs 에 추가: `http://localhost:3000/**`

## 2. 로컬에서 실행

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev                  # http://localhost:3000
```

`http://localhost:3000/admin` → 관리자 이메일 입력 → 메일의 링크 클릭 → 관리자 화면.
링크는 **요청한 같은 브라우저에서** 열어야 합니다. Supabase 기본 메일 발송은 시간당 몇 통으로 제한됩니다.

### 첫 로그인 직후 꼭 할 보안 설정

anon 키는 공개되므로, 누군가 관리자 이메일로 Supabase 에 직접 가입을 시도할 수 있습니다. 앱은 **이메일 인증이 끝난 계정만** 관리자로 인정하지만, 아래 설정으로 경로 자체를 막아 두세요.

1. Supabase → **Authentication → Users** 에 본인 계정 하나만 있는지 확인 (다른 계정이 있으면 삭제)
2. **Authentication → Sign In / Providers** → *Allow new users to sign up* **끄기** (이미 만든 본인 계정의 매직링크 로그인은 계속 됩니다)
3. 같은 화면 Email 항목에서 *Confirm email* 이 **켜져** 있는지 확인
4. (선택, 권장) Users 화면에서 본인 계정의 User UID 를 복사해 환경변수 `OWNER_USER_ID` 로 넣으면 계정 id 까지 고정됩니다.

관리자 이메일이 사이트에 공개되어 있으므로 누군가 로그인 요청을 반복하면 Supabase 기본 메일 발송 한도에 걸릴 수 있습니다. 문제가 되면 Authentication → Emails 에서 SMTP(예: Resend)를 연결하거나 Attack Protection 에서 CAPTCHA 를 켜세요.

## 3. GitHub 에 올리기

이 폴더는 이미 git 저장소이고 첫 커밋이 되어 있습니다.

1. <https://github.com/new> 에서 저장소를 만듭니다. (이름 예: `profile`, **README·.gitignore 추가하지 않기**, Private 권장)
2. 터미널에서:

```bash
git remote add origin https://github.com/<내아이디>/profile.git
git push -u origin main
```

비밀번호를 물으면 GitHub 비밀번호가 아니라 **Personal Access Token** 을 넣어야 합니다.
(GitHub → Settings → Developer settings → Personal access tokens → Fine-grained → 해당 저장소 `Contents: Read and write`)
`gh` CLI 를 설치했다면 `gh auth login` 후 `gh repo create profile --private --source . --push` 한 줄로도 됩니다.

## 4. Vercel 배포

1. <https://vercel.com/new> → GitHub 로 로그인 → 방금 만든 저장소 **Import**.
2. Framework 는 Next.js 로 자동 인식됩니다. **Environment Variables** 에 다섯 개를 넣습니다.

   | 이름 | 값 |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable 키 |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role / secret 키 |
   | `OWNER_EMAIL` | 관리자 이메일 |
   | `NEXT_PUBLIC_SITE_URL` | 일단 비워 두거나 `https://<프로젝트명>.vercel.app` |
   | `OWNER_USER_ID` (선택) | 본인 계정 User UID — 첫 로그인 후 추가 |

3. **Deploy**. 끝나면 `https://<프로젝트명>.vercel.app` 주소가 나옵니다.
4. 배포 주소로 마무리 설정:
   - Vercel → Settings → Environment Variables 에서 `NEXT_PUBLIC_SITE_URL` 을 실제 주소로 → Deployments 에서 **Redeploy**
   - Supabase → Authentication → URL Configuration: Site URL 을 실제 주소로, Redirect URLs 에 `https://<프로젝트명>.vercel.app/**` 추가
     (PR 프리뷰에서도 로그인하려면 `https://*-<vercel 팀명>.vercel.app/**` 도 추가)
5. 이후로는 `main` 에 push 하면 프로덕션, PR 을 열면 프리뷰 URL 이 자동으로 만들어집니다.
   **내용 수정은 배포가 필요 없습니다.** `/admin` 에서 저장하면 바로 반영됩니다.

선택: Vercel → Analytics 에서 Web Analytics 를 켜고 `NEXT_PUBLIC_ENABLE_ANALYTICS=1` 을 추가하면 방문 통계가 수집됩니다.

## 5. 배포 후 확인 (PRD 검증 방법)

- [ ] `/admin` 로그인 → 프로필 입력, CV PDF 업로드 → "CV 다운로드에 사용" 선택 → 공개로 변경 → 홈에 CV 버튼 표시
- [ ] 새 프로젝트 1건을 공개 상태로 저장 → 10초 안에 `/projects` 에 나타남 (재배포 없이)
- [ ] 첨부파일을 **비공개**로 두고, 로그아웃(또는 시크릿 창)에서 그 파일 링크를 열면 404
- [ ] 초안·비공개 항목이 공개 페이지·`/sitemap.xml` 에 나오지 않음
- [ ] 모바일(360px)에서 가로 스크롤 없음, 인쇄 미리보기에서 메뉴·버튼 숨김

## 사용 팁

- **섹션 순서**: `/admin/profile` 아래쪽에서 드래그로 바꾸고 숨길 수 있습니다. 기업 지원 때는 경력·역량을 위로 올리세요.
- **역량 근거 수**: 역량 이름과 같은 철자의 태그가 프로젝트(방법·도구·주제)나 업무 항목에 붙어 있으면 자동으로 "근거 N건 · 최근 YYYY.MM" 으로 집계됩니다.
- **첨부파일**: 업로드하면 기본 **비공개**입니다. 항목과 파일이 모두 공개여야 방문자가 내려받을 수 있습니다. 게재본 PDF 는 학술지 셀프 아카이빙 정책을 확인한 뒤 공개하세요.
- **공개 상태는 /admin 에서 바꾸세요**: 관리자 화면에서 저장하면 즉시 반영됩니다. Supabase 대시보드에서 직접 고친 내용은 최대 1시간 뒤에 반영됩니다.
- **첨부 크기**: 기본 25MB. 늘리려면 `NEXT_PUBLIC_MAX_UPLOAD_MB` 와 Supabase Storage 의 `attachments` 버킷 크기 제한을 함께 올리세요(무료 플랜 최대 50MB).
- **백업**: 대시보드의 "JSON 내보내기"를 월 1회 내려받아 보관하세요. Supabase 무료 플랜은 7일 이상 활동이 없으면 프로젝트가 일시 정지될 수 있습니다(대시보드에서 다시 켜면 됨).

## 구현 범위

PRD 의 P0 전부와 일부 P1 을 구현했습니다.

- 공개: P-01~P-09, P-06 인용 복사(ASA·BibTeX), P-11 다크 모드(시스템 설정 따름)
- 관리자: A-01~A-09, A-12 중 내보내기(가져오기는 미구현), A-11 중 변경 이력 기록(DB 트리거, 복원 화면은 미구현)
- 파일: F-01~F-09, F-11(항목 삭제 시 연결 파일 함께 삭제)
- SEO: 페이지별 메타·OG 이미지, sitemap.xml, robots.txt, JSON-LD(Person, ScholarlyArticle), 논문 페이지 `citation_*` 메타태그
- 미구현(2차): P-10 한/영 전환(영문 필드는 입력 가능), A-10 저장 전 미리보기, F-10 파일 교체, F-12 공유 링크(`share_links` 테이블만 준비), JSON 가져오기

## 구조

```
supabase/migrations/0001_init.sql   스키마·RLS·버킷 (SQL Editor 에서 실행)
src/proxy.ts                         /admin 세션·OWNER_EMAIL 확인 (Next 16 의 middleware)
src/lib/data.ts                      공개 페이지 데이터 ("use cache" + 저장 시 updateTag 로 무효화)
src/lib/sections.ts                  관리자 섹션·필드 정의 (폼·검증이 이 설정으로 동작)
src/app/admin/actions.ts             모든 쓰기 서버 액션 (매번 관리자 재확인, service role 사용)
src/app/api/files/[id]/route.ts      첨부 다운로드: 권한 확인 후 10분짜리 서명 URL 로 리다이렉트
```

보안 모델: 브라우저와 공개 페이지는 anon 키만 쓰고 RLS 로 `visibility='public'` 행만 읽습니다. 쓰기 정책은 없고, 모든 쓰기는 관리자 확인을 거친 서버 액션이 service role 키로 수행합니다. 파일은 모두 비공개 버킷에 있고 서버가 짧은 서명 URL 을 발급합니다.
