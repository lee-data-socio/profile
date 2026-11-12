# 개인 연구·이력 사이트

사회학 대학원생의 연구, 경력, 포트폴리오를 보여 주는 사이트입니다.
내용은 코드를 고치지 않고 관리자 화면(`/admin`)에서 입력하며, 저장하면 바로 사이트에 반영됩니다.

- **한국어 페이지**: `/` 홈, `/projects` 연구 프로젝트, `/publications` 논문·발표
- **영어 페이지**: `/en`, `/en/projects`, `/en/publications`
- **관리자 화면**: `/admin` (`.env.local` 의 `OWNER_EMAIL` 로 지정한 이메일 한 명만 로그인 가능)

---

## 전체 흐름 한눈에 보기

아래 단계를 **위에서부터 순서대로 한 번씩** 하면 됩니다. 각 단계 안의 체크박스(☐)도 위에서부터 차례로 따라 하세요.

| 단계 | 할 일 | 어디서 | 걸리는 시간 |
| --- | --- | --- | --- |
| 1 | Supabase 프로젝트 만들고 DB 준비 | Supabase 웹사이트 | 10분 |
| 2 | 키를 `.env.local` 파일에 넣기 | 내 컴퓨터 | 5분 |
| 3 | 내 컴퓨터에서 사이트 켜고 로그인 | 터미널 + 브라우저 | 5분 |
| 4 | 보안 설정 (첫 로그인 직후 한 번) | Supabase 웹사이트 | 3분 |
| 5 | 내용 입력 | `/admin` | 자유 |
| 6 | GitHub 에 올리기 | GitHub + 터미널 | 5분 |
| 7 | Vercel 로 인터넷에 공개 | Vercel 웹사이트 | 10분 |
| 8 | 공개 후 확인 | 배포된 사이트 | 5분 |

> **중요한 개념 하나**: 입력한 내용은 내 컴퓨터가 아니라 **Supabase DB 한 곳**에 저장됩니다.
> 내 컴퓨터(`localhost`)와 공개 사이트(Vercel)가 같은 DB 를 보기 때문에, **3단계에서 입력한 내용은 7단계 공개 후에도 그대로 나옵니다.** 다시 입력할 필요가 없습니다.

### 시작 전 준비물

- 계정: [Supabase](https://supabase.com), [GitHub](https://github.com), [Vercel](https://vercel.com) (모두 무료, Vercel 은 GitHub 계정으로 로그인 가능)
- 내 컴퓨터에 [Node.js](https://nodejs.org) 20 이상 (LTS 버전 설치)
- 터미널은 이 프로젝트 폴더에서 엽니다.

---

## 1단계. Supabase 준비

### 1-1. 프로젝트 만들기

- [ ] <https://supabase.com> 에 로그인 → **New project**
- [ ] Region 은 `Northeast Asia (Seoul)` 선택
- [ ] DB 비밀번호는 아무 곳에 적어 두세요 (이 사이트에서는 쓰지 않지만 나중에 필요할 수 있습니다)

### 1-2. DB 만들기 (SQL 두 개 실행)

- [ ] 왼쪽 메뉴 **SQL Editor** → **New query**
- [ ] 이 폴더의 `supabase/migrations/0001_init.sql` 파일을 열어 **내용 전체**를 복사 → 붙여 넣기 → **Run**
- [ ] 다시 **New query** → `supabase/migrations/0002_english_fields.sql` 내용 전체를 붙여 넣고 → **Run**

**"Potential issues detected" 경고 창이 뜨면** → **Run and enable RLS** 를 누르세요.
이 SQL 은 이미 보안(RLS)을 모두 켜도록 작성되어 있고, "삭제(destructive)" 경고는 설정을 다시 만들기 위한 것이라 입력한 데이터는 지워지지 않습니다. 두 파일 모두 여러 번 실행해도 안전합니다.

> 이미 `0001` 만 실행해 둔 경우에는 `0002` 만 실행하면 됩니다.
> `0002` 를 실행하지 않으면 관리자 화면에서 저장할 때 오류가 납니다.

### 1-3. 값 3개 복사해 두기

메모장을 열고 아래 3개를 복사해 둡니다. 2단계에서 씁니다.

| 복사할 것 | 어디서 찾나요 |
| --- | --- |
| **Project URL** (`https://xxxx.supabase.co`) | 화면 맨 위 **Connect** 버튼, 또는 **Project Settings → Data API** |
| **anon 키** (새 화면에서는 **publishable** 키) | **Project Settings → API Keys** |
| **service_role 키** (새 화면에서는 **secret** 키) | **Project Settings → API Keys** |

- `service_role`(secret) 키는 **관리자 비밀번호와 같습니다. 다른 사람에게 보여 주거나 인터넷에 올리지 마세요.**
- Project URL 을 못 찾겠으면: 브라우저 주소창의 `supabase.com/dashboard/project/abcdefgh` 에서 끝부분 `abcdefgh` 를 넣어 `https://abcdefgh.supabase.co` 로 쓰면 됩니다.

### 1-4. 로그인 주소 설정

- [ ] **Authentication → URL Configuration**
- [ ] **Site URL**: `http://localhost:3000`
- [ ] **Redirect URLs** → **Add URL**: `http://localhost:3000/**`

(공개 후 7단계에서 Vercel 주소를 하나 더 추가합니다.)

---

## 2단계. `.env.local` 파일에 키 넣기

`.env.local` 은 사이트가 Supabase 에 접속할 때 쓰는 설정 파일입니다. 파일 이름이 **점(.)으로 시작**합니다.

- [ ] 터미널에서 설정 파일 만들기:

  ```bash
  cp .env.example .env.local
  ```

- [ ] `.env.local` 을 열어 `=` 뒤에 1-3 에서 복사한 값을 붙여 넣습니다.

  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...(anon / publishable 키)
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...(service_role / secret 키)
  OWNER_EMAIL=내이메일@gmail.com
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  ```

**자주 하는 실수**

- `=` 앞뒤에 **띄어쓰기 넣지 않기**, 따옴표(`"`) 쓰지 않기
- 키 두 개를 **바꿔 넣지 않기** (anon → `ANON_KEY`, service_role → `SERVICE_ROLE_KEY`)
- Project URL 끝에 `/` 나 `/rest/v1` 붙이지 않기
- `#` 으로 시작하는 줄은 설명이니 그대로 두기

`.env.local` 은 GitHub 에 올라가지 않도록 이미 설정되어 있습니다 (`.gitignore`).

---

## 3단계. 내 컴퓨터에서 사이트 켜기

- [ ] 터미널에서:

  ```bash
  npm install      # 처음 한 번만
  npm run dev      # 사이트 켜기 (끌 때는 Ctrl + C)
  ```

- [ ] 브라우저에서 <http://localhost:3000> 열기
  → 처음에는 **이름 한 줄만 크게** 보이는 게 정상입니다. 아직 내용을 입력하지 않았기 때문입니다.
- [ ] <http://localhost:3000/admin> 열기 → `OWNER_EMAIL` 에 넣은 이메일 입력
- [ ] 받은 메일의 링크 클릭 → 관리자 화면이 나오면 성공
  - 링크는 **로그인을 요청한 같은 브라우저**에서 열어야 합니다.
  - 메일이 안 오면 스팸함을 확인하세요. Supabase 기본 메일은 **시간당 몇 통**만 보낼 수 있어서, 여러 번 요청했다면 잠시 기다려야 합니다.

`.env.local` 을 고쳤다면 `Ctrl + C` 로 끄고 `npm run dev` 로 다시 켜야 반영됩니다.

---

## 4단계. 보안 설정 (첫 로그인 직후 한 번)

anon 키는 공개되는 키라서, 다른 사람이 관리자 이메일로 Supabase 에 가입을 시도할 수 있습니다. 사이트는 이메일 인증을 마친 본인 계정만 관리자로 인정하지만, 아래 설정으로 가입 자체를 막아 두세요.

- [ ] Supabase → **Authentication → Users**: 본인 계정 **하나만** 있는지 확인 (다른 계정이 있으면 삭제)
- [ ] **Authentication → Sign In / Providers** → *Allow new users to sign up* **끄기**
      (이미 만든 본인 계정의 로그인은 계속 됩니다)
- [ ] 같은 화면 Email 항목에서 *Confirm email* 이 **켜져** 있는지 확인
- [ ] (권장) Users 화면에서 본인 계정의 **User UID** 를 복사 → `.env.local` 에 한 줄 추가 → 사이트 다시 켜기

  ```bash
  OWNER_USER_ID=복사한-User-UID
  ```

로그인 요청이 반복되어 메일 한도에 자주 걸리면 **Authentication → Emails** 에서 SMTP(예: Resend)를 연결하거나 **Attack Protection** 에서 CAPTCHA 를 켜세요.

---

## 5단계. 내용 입력

`/admin` 에서 프로필, 학력, 논문, 프로젝트, 경력 등을 입력합니다.

- **공개 상태를 꼭 확인하세요.** 새 항목은 기본이 **초안**이라 사이트에 나오지 않습니다. 보이게 하려면 **공개**로 바꿔 저장하세요.
- 저장하면 바로 반영됩니다 (새로고침).
- 시험 삼아 넣은 내용은 공개 전에 삭제하거나 **초안/비공개**로 바꿔 두세요.

### 영어 페이지(`/en`) 채우기

- 각 입력 화면의 **"(영문)"** 칸을 채운 항목만 `/en` 에 나옵니다. 영문 칸이 비어 있으면 영어 페이지에서는 그 항목이 빠집니다.
- 꼭 채워야 하는 영문 칸:

  | 섹션 | 필요한 영문 칸 |
  | --- | --- |
  | 논문·발표, 연구 프로젝트, 연구 관심사 | 제목 (영문) |
  | 학력 | 학교 (영문), 전공 (영문) |
  | 경력 | 기관 (영문), 직함 (영문) |
  | 교육 경력 | 과목명 (영문) |
  | 수상, 학술활동 | 명칭 / 활동명 (영문) |
  | 업무 항목 | 문장 (영문) |
  | 역량 | 이름 (영문) |

  원래 칸에 처음부터 영어로 입력했다면(한글이 없으면) 영문 칸은 비워 둬도 그 값이 영어 페이지에 쓰입니다 (예: 역량 `Stata`, 영어 논문 제목).

- 나머지 영문 칸도 같은 규칙이고, 원래 값에 한글이 있으면 영어 페이지에서 생략됩니다.
- 프로필의 **연구 관심사 키워드**는 영어 페이지용 **연구 관심사 키워드 (영문)** 칸에 따로 넣어야 합니다.
- 사이트 상단의 **English / 한국어** 버튼으로 같은 페이지의 다른 언어판으로 이동합니다.

---

## 6단계. GitHub 에 올리기

- [ ] <https://github.com/new> 에서 새 저장소 만들기
  - 이름 예: `profile`
  - **Private** 권장
  - README, .gitignore 는 **추가하지 않기** (체크 해제)
- [ ] 터미널에서 (`<내아이디>` 를 본인 GitHub 아이디로 바꾸기):

  ```bash
  git remote add origin https://github.com/<내아이디>/profile.git
  git push -u origin main
  ```

- 비밀번호를 물으면 GitHub 비밀번호가 아니라 **Personal Access Token** 을 넣어야 합니다.
  만드는 곳: GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained** → 해당 저장소에 `Contents: Read and write` 권한
- `gh` CLI 가 있다면 `gh auth login` 후 아래 한 줄로도 됩니다.

  ```bash
  gh repo create profile --private --source . --push
  ```

---

## 7단계. Vercel 로 인터넷에 공개

### 7-1. 배포

- [ ] <https://vercel.com/new> → GitHub 로 로그인 → 6단계에서 만든 저장소 **Import**
- [ ] Framework 는 Next.js 로 자동 선택됩니다.
- [ ] **Environment Variables** 에 `.env.local` 과 같은 값을 넣습니다.

  | 이름 | 값 |
  | --- | --- |
  | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable 키 |
  | `SUPABASE_SERVICE_ROLE_KEY` | service_role / secret 키 |
  | `OWNER_EMAIL` | 관리자 이메일 |
  | `NEXT_PUBLIC_SITE_URL` | 지금은 비워 두기 (7-2 에서 채움) |
  | `OWNER_USER_ID` | (4단계에서 만들었다면) User UID |

- [ ] **Deploy** → 끝나면 `https://<프로젝트명>.vercel.app` 주소가 나옵니다.

### 7-2. 공개 주소로 마무리 설정

- [ ] Vercel → 프로젝트 → **Settings → Environment Variables** → `NEXT_PUBLIC_SITE_URL` 을 `https://<프로젝트명>.vercel.app` 로 저장
- [ ] **Deployments** → 맨 위 배포의 `⋯` → **Redeploy**
- [ ] Supabase → **Authentication → URL Configuration**
  - **Site URL** 을 `https://<프로젝트명>.vercel.app` 로 변경
  - **Redirect URLs** 에 `https://<프로젝트명>.vercel.app/**` 추가 (`localhost` 주소는 그대로 둬도 됩니다)

이제 공개 사이트의 `/admin` 에서도 같은 이메일로 로그인할 수 있습니다.

### 이후에는

- **내용 수정은 배포가 필요 없습니다.** 내 컴퓨터든 공개 사이트든 `/admin` 에서 저장하면 바로 반영됩니다.
- 코드를 고친 경우에만 `git push` 하면 Vercel 이 자동으로 다시 배포합니다.
- (선택) Vercel → **Analytics** 에서 Web Analytics 를 켜고 환경변수 `NEXT_PUBLIC_ENABLE_ANALYTICS=1` 을 추가하면 방문 통계를 볼 수 있습니다.

---

## 8단계. 공개 후 확인

- [ ] `/admin` 로그인 → 프로필 입력 → CV PDF 업로드 → "CV 다운로드에 사용" 선택 → 공개로 변경 → 홈에 **CV 다운로드** 버튼이 보임
- [ ] 새 프로젝트 1건을 **공개**로 저장 → 10초 안에 `/projects` 에 나타남
- [ ] 첨부파일을 **비공개**로 두고, 시크릿 창에서 그 파일 링크를 열면 404
- [ ] 초안·비공개 항목이 공개 페이지와 `/sitemap.xml` 에 나오지 않음
- [ ] 영문 제목을 채운 항목만 `/en` 에 보임
- [ ] 휴대폰에서 가로 스크롤이 생기지 않음, 인쇄 미리보기에서 메뉴·버튼이 숨겨짐

---

## 자주 묻는 질문

**Q. 홈에 이름만 크게 나와요.**
정상입니다. 아직 입력한 내용이 없거나 항목이 **초안** 상태입니다. `/admin` 에서 입력하고 **공개**로 저장하세요.

**Q. 내 컴퓨터에서 입력한 내용을 공개 후에 다시 입력해야 하나요?**
아니요. 같은 Supabase DB 를 쓰므로 그대로 나옵니다.

**Q. 로그인 메일이 안 와요 / 링크를 눌렀는데 오류가 나요.**
- 스팸함 확인, 잠시 후 다시 시도 (메일 발송 한도)
- 요청한 **같은 브라우저**에서 링크 열기
- 1-4 (또는 7-2) 의 **Redirect URLs** 에 지금 쓰는 주소가 들어 있는지 확인
- `.env.local` 의 `OWNER_EMAIL` 이 입력한 이메일과 같은지 확인

**Q. 관리자 화면에서 저장하면 오류가 나요.**
1-2 의 `0002_english_fields.sql` 을 실행했는지 확인하세요.

**Q. Supabase 대시보드에서 직접 고쳤는데 반영이 안 돼요.**
대시보드에서 직접 고친 내용은 최대 1시간 뒤에 반영됩니다. `/admin` 에서 저장하면 바로 반영됩니다.

---

## 사용 팁

- **섹션 순서**: `/admin/profile` 아래쪽에서 드래그로 순서를 바꾸거나 숨길 수 있습니다. 기업 지원 때는 경력·역량을 위로 올리세요.
- **역량 근거 수**: 역량 이름과 철자가 같은 태그가 프로젝트(방법·도구·주제)나 업무 항목에 붙어 있으면 "근거 N건 · 최근 YYYY.MM" 으로 자동 집계됩니다.
- **첨부파일**: 업로드하면 기본 **비공개**입니다. 항목과 파일이 **둘 다 공개**여야 방문자가 내려받을 수 있습니다. 게재된 논문 PDF 는 학술지의 셀프 아카이빙 정책을 확인한 뒤 공개하세요.
- **첨부 크기**: 기본 25MB. 늘리려면 환경변수 `NEXT_PUBLIC_MAX_UPLOAD_MB` 와 Supabase Storage 의 `attachments` 버킷 크기 제한을 함께 올리세요 (무료 플랜 최대 50MB).
- **백업**: 관리자 화면의 **JSON 내보내기**를 한 달에 한 번 내려받아 보관하세요.
- **Supabase 일시 정지**: 무료 플랜은 7일 이상 활동이 없으면 프로젝트가 일시 정지될 수 있습니다. Supabase 대시보드에서 다시 켜면 됩니다.

---

## 개발자 참고

### 기술 스택

Next.js 16 (App Router, Cache Components) · Supabase (PostgreSQL, Auth, Storage) · Tailwind CSS 4 · Tiptap · Vercel.
요구사항은 `이력서 사이트 PRD.md` 를 참고하세요.

### 구현 범위

PRD 의 P0 전부와 일부 P1 을 구현했습니다.

- 공개: P-01~P-09, P-06 인용 복사(ASA·BibTeX), P-10 한/영 전환(`/en`, 영문 제목이 있는 항목만 표시), P-11 다크 모드(시스템 설정 따름)
- 관리자: A-01~A-09, A-12 중 내보내기(가져오기는 미구현), A-11 중 변경 이력 기록(DB 트리거, 복원 화면은 미구현)
- 파일: F-01~F-09, F-11(항목 삭제 시 연결 파일 함께 삭제)
- SEO: 페이지별 메타·OG 이미지, sitemap.xml, robots.txt, hreflang, JSON-LD(Person, ScholarlyArticle), 논문 페이지 `citation_*` 메타태그
- 미구현(2차): A-10 저장 전 미리보기, F-10 파일 교체, F-12 공유 링크(`share_links` 테이블만 준비), JSON 가져오기

### 구조

```
supabase/migrations/0001_init.sql            스키마·RLS·버킷 (SQL Editor 에서 실행)
supabase/migrations/0002_english_fields.sql  영문(_en) 컬럼 추가 (0001 다음에 실행)
src/proxy.ts                                 /admin 세션·OWNER_EMAIL 확인 (Next 16 의 middleware)
src/app/[lang]/                              공개 페이지 (ko·en). 한국어는 next.config 의 rewrites 로 접두어 없는 주소에서 제공
src/lib/data.ts                              공개 페이지 데이터 ("use cache" + 저장 시 updateTag 로 무효화)
src/lib/i18n.ts                              한/영 고정 문구와 언어별 항목 필터링·치환 (캐시 바깥에서 처리)
src/lib/sections.ts                          관리자 섹션·필드 정의 (폼·검증이 이 설정으로 동작)
src/app/admin/actions.ts                     모든 쓰기 서버 액션 (매번 관리자 재확인, service role 사용)
src/app/api/files/[id]/route.ts              첨부 다운로드: 권한 확인 후 10분짜리 서명 URL 로 리다이렉트
```

### 보안 모델

브라우저와 공개 페이지는 anon 키만 쓰고, RLS 로 `visibility='public'` 행만 읽습니다. 쓰기 정책은 없고, 모든 쓰기는 관리자 확인을 거친 서버 액션이 service role 키로 수행합니다. 파일은 모두 비공개 버킷에 있고, 서버가 짧은 서명 URL 을 발급합니다.
