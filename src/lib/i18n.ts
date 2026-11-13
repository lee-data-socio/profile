/**
 * 한/영 전환 (P-10). 한국어는 접두어 없는 주소(/, /projects …), 영어는 /en 아래.
 * 데이터 함수(data.ts)는 언어와 무관하게 공개 행을 모두 캐시하고, 언어별 필터링·치환은
 * 여기의 localize* 함수가 캐시 바깥에서 한다.
 *
 * 영어 규칙: 모든 글자 필드는 영문 값 → 원래 값에 한글이 없으면 그대로 → 둘 다 아니면 없음.
 * 주 필드(제목 등)가 없으면 항목을 숨기고(상세는 404), 나머지 필드는 생략한다.
 */
import {
  APPROACH_LABEL,
  ATTACHMENT_KIND_LABEL,
  EXPERIENCE_TYPE_LABEL,
  PUBLICATION_TYPE_LABEL,
  PUB_STATUS_LABEL,
  SECTION_LABEL,
  SKILL_CATEGORY_LABEL,
  TEACHING_TYPES,
  VERSION_TYPE_LABEL,
} from "@/lib/labels";
import type {
  Activity,
  Approach,
  Attachment,
  AttachmentKind,
  Award,
  Education,
  EntryItem,
  Experience,
  ExperienceType,
  Profile,
  Project,
  PubStatus,
  Publication,
  PublicationType,
  ResearchInterest,
  SectionKey,
  Skill,
  SkillCategory,
} from "@/lib/types";

export const LANGS = ["ko", "en"] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGS as readonly string[]).includes(v);
}

/** 언어별 주소: localePath("en", "/projects") → "/en/projects" */
export function localePath(lang: Lang, path: string): string {
  if (lang === "ko") return path;
  return path === "/" ? "/en" : `/en${path}`;
}

/** 별도 페이지가 있는 섹션. 나머지 섹션은 홈의 #앵커로 이동한다. */
const SECTION_PAGE: Partial<Record<SectionKey, string>> = {
  publications: "/publications",
  projects: "/projects",
  experiences: "/experience",
  teaching: "/training",
};

export function sectionHref(lang: Lang, key: SectionKey): string {
  const page = SECTION_PAGE[key];
  return page ? localePath(lang, page) : `${localePath(lang, "/")}#${key}`;
}

/** 두 언어 페이지가 모두 있을 때 hreflang 대체 주소 (x-default 는 한국어) */
export function languageAlternates(path: string) {
  return { ko: path, en: localePath("en", path), "x-default": path };
}

const HANGUL_RE = /[ᄀ-ᇿ㄰-㆏ꥠ-꥿가-힯ힰ-퟿]/;

export function hasHangul(s: string): boolean {
  return HANGUL_RE.test(s);
}

/* ------------------------------------------------------------------ */
/* 고정 문구                                                            */
/* ------------------------------------------------------------------ */

const ko = {
  locale: "ko_KR",
  section: SECTION_LABEL,
  pubType: PUBLICATION_TYPE_LABEL,
  pubStatus: PUB_STATUS_LABEL,
  approach: APPROACH_LABEL,
  experienceType: EXPERIENCE_TYPE_LABEL,
  skillCategory: SKILL_CATEGORY_LABEL,
  attachmentKind: ATTACHMENT_KIND_LABEL,
  versionType: VERSION_TYPE_LABEL as Record<"published" | "preprint", string>,
  /** 학력의 학위·상태는 저장된 한글 값을 그대로 쓴다 */
  degree: {} as Record<string, string>,
  eduStatus: {} as Record<string, string>,
  present: "현재",

  skipToContent: "본문으로 건너뛰기",
  mainNav: "주 메뉴",
  cvDownloadSr: " 다운로드",
  cvDownload: "CV 다운로드",
  lastUpdated: "마지막 업데이트",
  tags: "태그",
  photoAlt: (name: string) => `${name} 프로필 사진`,
  ogImageAlt: "프로필",
  siteDescription: (name: string) => `${name}의 연구·경력 포트폴리오`,

  more: (n: number) => `전체 ${n}건`,
  details: "자세히 보기",
  experiencesDescription: "연구조교·인턴·직장 경력과 맡은 업무",
  teachingDescription: "이수한 교육 과정과 부트캠프",
  relProject: "프로젝트",
  relPublication: "논문",
  advisor: (name: string) => `지도교수 ${name}`,
  thesis: (title: string) => `학위논문: “${title}”`,
  educationTitle: (e: { school: string; major: string; degree: string }) => `${e.school} ${e.major} ${e.degree}`,
  evidence: "근거",
  supervisor: (name: string) => `담당 교수 ${name}`,
  skillEvidence: (n: number) => `근거 ${n}건`,
  skillRecent: (month: string) => `최근 ${month}`,
  email: "이메일",
  website: "웹사이트",
  showEmail: "이메일 주소 보기",

  projectsDescription: "수행한 연구과제와 개인 연구 프로젝트 목록",
  projectsIntro: "연구과제와 개인 연구를 방법·주제·연도로 골라 볼 수 있습니다.",
  projectsEmpty: "아직 공개된 프로젝트가 없습니다.",
  listEmpty: "아직 공개된 항목이 없습니다.",
  filter: {
    group: "프로젝트 필터",
    approach: "방법",
    topic: "주제",
    year: "연도",
    all: "전체",
    reset: "초기화",
    count: "{n}건",
    none: "조건에 맞는 프로젝트가 없습니다.",
  },
  breadcrumb: "경로",
  loading: "불러오는 중…",
  notFoundTitle: "찾을 수 없음",
  projectFallbackDescription: (title: string) => `${title} 연구 프로젝트`,
  fact: {
    period: "기간",
    role: "역할",
    org: "소속",
    funder: "발주·지원",
    methods: "연구 방법",
    data: "데이터",
    tools: "사용 도구",
  },
  researchQuestion: "연구 질문",
  work: "수행 내용",
  findings: "결과",
  relatedPublications: "관련 논문·발표",
  relatedProject: "관련 연구 프로젝트",
  attachments: "첨부파일",

  publicationsDescription: "학술지 논문, 학위논문, 학술대회 발표, 연구보고서, 워킹페이퍼 목록",
  publicationsIntro: "유형별로, 최근 것부터 정리했습니다. 굵은 이름이 본인입니다.",
  publicationsJump: "유형 바로가기",
  publicationsEmpty: "아직 공개된 논문·발표가 없습니다.",
  citation: "인용 (ASA)",
  cite: "인용",
  copy: { asa: "ASA 복사", bibtex: "BibTeX 복사", copied: "복사됨", prompt: "아래 내용을 복사하세요" },
  link: "링크",
  viewDoi: "DOI",
  sourceLink: "원문 링크",
  abstract: "초록",

  download: "다운로드",
  downloadLabel: (name: string, type: string, size: string) => `${name} 다운로드 (${type}, ${size})`,
  preview: {
    open: "미리보기",
    close: "미리보기 닫기",
    fallback: "미리보기가 보이지 않으면",
    newWindow: "새 창에서 열기",
    title: "{title} 미리보기",
  },

  notFound: {
    heading: "페이지를 찾을 수 없습니다",
    body: "주소가 바뀌었거나 비공개로 전환된 항목일 수 있습니다.",
    home: "← 홈으로",
  },
};

export type Dict = typeof ko;

const en: Dict = {
  locale: "en_US",
  section: {
    interests: "Research Interests",
    education: "Education",
    publications: "Publications",
    projects: "Research Projects",
    experiences: "Experience",
    teaching: "Training",
    skills: "Methods & Skills",
    awards: "Honors, Scholarships & Grants",
    activities: "Academic Activities",
    contact: "Contact",
  } satisfies Record<SectionKey, string>,
  pubType: {
    journal: "Journal Articles",
    thesis: "Theses",
    conference: "Conference Presentations",
    report: "Research Reports",
    working_paper: "Working Papers",
    book_chapter: "Books & Chapters",
  } satisfies Record<PublicationType, string>,
  pubStatus: {
    published: "Published",
    accepted: "Forthcoming",
    under_review: "Under review",
    in_preparation: "In preparation",
    presented: "Presented",
  } satisfies Record<PubStatus, string>,
  approach: {
    quantitative: "Quantitative",
    qualitative: "Qualitative",
    mixed: "Mixed methods",
  } satisfies Record<Approach, string>,
  experienceType: {
    RA: "Research Assistant",
    TA: "Teaching Assistant",
    intern: "Intern",
    job: "Employment",
    lecture: "Course",
    other: "Other",
  } satisfies Record<ExperienceType, string>,
  skillCategory: {
    quantitative: "Quantitative Methods",
    qualitative: "Qualitative Methods",
    survey_design: "Survey Design",
    tool: "Tools",
    language: "Languages",
  } satisfies Record<SkillCategory, string>,
  attachmentKind: {
    paper: "Paper",
    report: "Report",
    slides: "Slides",
    poster: "Poster",
    questionnaire: "Questionnaire",
    codebook: "Codebook",
    cv: "CV",
    other: "Other",
  } satisfies Record<AttachmentKind, string>,
  versionType: { published: "Published version", preprint: "Author manuscript (preprint)" },
  degree: { 학사: "Bachelor's", 석사: "Master's", 박사: "Ph.D.", 석박사통합: "Integrated Master's–Ph.D." },
  eduStatus: { 재학: "In progress", 수료: "Coursework completed", 졸업: "Completed", 휴학: "On leave" },
  present: "Present",

  skipToContent: "Skip to content",
  mainNav: "Main menu",
  cvDownloadSr: " download",
  cvDownload: "Download CV",
  lastUpdated: "Last updated",
  tags: "Tags",
  photoAlt: (name) => `Photo of ${name}`,
  ogImageAlt: "Profile card",
  siteDescription: (name) => `Research and career portfolio of ${name}`,

  more: (n) => `All ${n}`,
  details: "Details",
  experiencesDescription: "Research assistantships, internships, and employment",
  teachingDescription: "Completed training programs and bootcamps",
  relProject: "Project",
  relPublication: "Paper",
  advisor: (name) => `Advisor: ${name}`,
  thesis: (title) => `Thesis: “${title}”`,
  educationTitle: (e) => `${e.degree} in ${e.major}, ${e.school}`,
  evidence: "Evidence",
  supervisor: (name) => `Supervisor: ${name}`,
  skillEvidence: (n) => `${n} ${n === 1 ? "record" : "records"}`,
  skillRecent: (month) => `last used ${month}`,
  email: "Email",
  website: "Website",
  showEmail: "Show email address",

  projectsDescription: "Funded research projects and independent research",
  projectsIntro: "Browse funded and independent research by method, topic, and year.",
  projectsEmpty: "No projects have been published yet.",
  listEmpty: "Nothing has been published here yet.",
  filter: {
    group: "Project filters",
    approach: "Method",
    topic: "Topic",
    year: "Year",
    all: "All",
    reset: "Reset",
    count: "{n} shown",
    none: "No projects match these filters.",
  },
  breadcrumb: "Breadcrumb",
  loading: "Loading…",
  notFoundTitle: "Not found",
  projectFallbackDescription: (title) => `Research project: ${title}`,
  fact: {
    period: "Period",
    role: "Role",
    org: "Affiliation",
    funder: "Funder",
    methods: "Methods",
    data: "Data",
    tools: "Tools",
  },
  researchQuestion: "Research question",
  work: "What I did",
  findings: "Findings",
  relatedPublications: "Related publications",
  relatedProject: "Related research project",
  attachments: "Files",

  publicationsDescription: "Journal articles, theses, conference presentations, research reports, and working papers",
  publicationsIntro: "Grouped by type, newest first. My name is shown in bold.",
  publicationsJump: "Jump to type",
  publicationsEmpty: "No publications have been published yet.",
  citation: "Citation (ASA)",
  cite: "Cite",
  copy: { asa: "Copy ASA", bibtex: "Copy BibTeX", copied: "Copied", prompt: "Copy the text below" },
  link: "Link",
  viewDoi: "DOI",
  sourceLink: "Full text",
  abstract: "Abstract",

  download: "Download",
  downloadLabel: (name, type, size) => `Download ${name} (${type}, ${size})`,
  preview: {
    open: "Preview",
    close: "Close preview",
    fallback: "If the preview does not appear,",
    newWindow: "open it in a new window",
    title: "Preview of {title}",
  },

  notFound: {
    heading: "Page not found",
    body: "The address may have changed, or the item is no longer public.",
    home: "← Home",
  },
};

const DICTS: Record<Lang, Dict> = { ko, en };

export function getDict(lang: Lang): Dict {
  return DICTS[lang];
}

/* ------------------------------------------------------------------ */
/* 내용 현지화: 영어는 영문 값으로 바꾼 같은 모양의 행, 표시하지 않을 항목은 null      */
/* ------------------------------------------------------------------ */

/** 비어 있지 않은 영문 문자열 */
function enOnly(v: string | null | undefined): string | null {
  return v?.trim() || null;
}

/** 영문 값, 없으면 원래 값에 한글이 없을 때만 그대로 (예: "Stata", 학술지 영문명) */
function enText(enValue: string | null | undefined, original: string | null | undefined): string | null {
  return enOnly(enValue) ?? (original && !hasHangul(original) ? original : null);
}

function noHangul(list: string[]): string[] {
  return list.filter((t) => !hasHangul(t));
}

export function localizeAll<T>(rows: T[], lang: Lang, fn: (row: T, lang: Lang) => T | null): T[] {
  if (lang === "ko") return rows;
  return rows.flatMap((r) => fn(r, lang) ?? []);
}

export function localizeProfile(p: Profile, lang: Lang): Profile {
  if (lang === "ko") return p;
  return {
    ...p,
    // 영문 이름이 없을 때만 한글 이름을 그대로 쓴다 (유일한 한글 대체)
    name: enOnly(p.name_en) ?? p.name,
    name_en: null,
    headline: enText(p.headline_en, p.headline),
    bio: p.bio_en,
    interests: p.interests_en ?? [],
    site_title: enText(p.site_title_en, p.site_title),
  };
}

/** 헤더·탭 제목에 쓰는 사이트 이름 (localizeProfile 을 거친 값). 지정하지 않았으면 이름. */
export function siteTitle(p: Profile): string {
  return p.site_title?.trim() || p.name;
}

export function localizeInterest(r: ResearchInterest, lang: Lang): ResearchInterest | null {
  if (lang === "ko") return r;
  const title = enText(r.title_en, r.title);
  return title ? { ...r, title, description: enText(r.description_en, r.description) } : null;
}

export function localizeEducation(e: Education, lang: Lang): Education | null {
  if (lang === "ko") return e;
  const school = enText(e.school_en, e.school);
  const major = enText(e.major_en, e.major);
  if (!school || !major) return null;
  return {
    ...e,
    school,
    major,
    advisor: enText(e.advisor_en, e.advisor),
    thesis_title: enText(e.thesis_title_en, e.thesis_title),
  };
}

export function localizePublication(p: Publication, lang: Lang): Publication | null {
  if (lang === "ko") return p;
  const title = enText(p.title_en, p.title);
  if (!title) return null;
  return {
    ...p,
    title,
    venue: enText(p.venue_en, p.venue),
    abstract: enText(p.abstract_en, p.abstract),
    // 저자 이름은 고유명사라 영문 이름이 없으면 원래 이름을 쓴다 (인용에서 저자를 빼면 안 되므로)
    authors: p.authors.map((a) => ({ ...a, name: enOnly(a.name_en) ?? a.name })),
  };
}

export function localizeProject(p: Project, lang: Lang): Project | null {
  if (lang === "ko") return p;
  const title = enText(p.title_en, p.title);
  if (!title) return null;
  return {
    ...p,
    title,
    summary: enText(p.summary_en, p.summary),
    org: enText(p.org_en, p.org),
    funder: enText(p.funder_en, p.funder),
    role: enText(p.role_en, p.role),
    research_question: p.research_question_en ?? null,
    findings: p.findings_en ?? null,
    methods: p.methods_en ?? [],
    data_sources: p.data_sources_en ?? [],
    tools: noHangul(p.tools),
    tags: p.tags_en ?? [],
  };
}

export function localizeExperience(e: Experience, lang: Lang): Experience | null {
  if (lang === "ko") return e;
  const common = {
    description: enText(e.description_en, e.description),
    semester: enText(e.semester_en, e.semester),
    supervisor: enText(e.supervisor_en, e.supervisor),
  };
  if (TEACHING_TYPES.includes(e.type)) {
    const course = enText(e.course_name_en, e.course_name);
    if (!course) return null;
    return { ...e, ...common, course_name: course, title: enText(e.title_en, e.title) ?? "", org: enText(e.org_en, e.org) ?? "" };
  }
  const org = enText(e.org_en, e.org);
  const title = enText(e.title_en, e.title);
  return org && title ? { ...e, ...common, org, title } : null;
}

export function localizeEntryItem(i: EntryItem, lang: Lang): EntryItem | null {
  if (lang === "ko") return i;
  const text = enText(i.text_en, i.text);
  if (!text) return null;
  return { ...i, text, metrics: i.metrics_en?.length ? i.metrics_en : noHangul(i.metrics) };
}

export function localizeSkill(s: Skill, lang: Lang): Skill | null {
  if (lang === "ko") return s;
  const name = enText(s.name_en, s.name);
  return name ? { ...s, name, description: enText(s.description_en, s.description) } : null;
}

export function localizeAward(a: Award, lang: Lang): Award | null {
  if (lang === "ko") return a;
  const name = enText(a.name_en, a.name);
  if (!name) return null;
  return {
    ...a,
    name,
    org: enText(a.org_en, a.org),
    amount: enText(a.amount_en, a.amount),
    description: enText(a.description_en, a.description),
  };
}

export function localizeActivity(a: Activity, lang: Lang): Activity | null {
  if (lang === "ko") return a;
  const name = enText(a.name_en, a.name);
  return name ? { ...a, name, org: enText(a.org_en, a.org), role: enText(a.role_en, a.role) } : null;
}

export function localizeAttachment(f: Attachment, lang: Lang): Attachment {
  if (lang === "ko") return f;
  return {
    ...f,
    // 영문 표시 이름 → 한글 없는 표시 이름·파일명 → 파일 종류 ("Report")
    display_name: enText(f.display_name_en, f.display_name) ?? enText(null, f.original_name) ?? en.attachmentKind[f.kind],
    description: enText(f.description_en, f.description),
  };
}
