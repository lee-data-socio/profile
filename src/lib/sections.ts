/**
 * 관리자 섹션 정의. 폼·검증·목록이 모두 이 설정 하나로 동작한다.
 * 클라이언트 컴포넌트에도 그대로 넘기므로 함수 없이 순수 데이터로만 작성한다.
 */
import {
  APPROACH_LABEL,
  EXPERIENCE_TYPE_LABEL,
  PUBLICATION_TYPE_LABEL,
  PUB_STATUS_LABEL,
  SKILL_CATEGORY_LABEL,
} from "@/lib/labels";

export type TagGroup = "topic" | "method" | "tool" | "data" | "any" | "topic_en" | "method_en" | "data_en";
export type Option = { value: string; label: string };

type FieldBase = {
  name: string;
  label: string;
  required?: boolean;
  help?: string;
  placeholder?: string;
  /** 두 칸 그리드에서 반 칸만 차지 */
  half?: boolean;
};

export type FieldDef =
  | (FieldBase & { type: "text"; suggestions?: string[] })
  | (FieldBase & { type: "textarea" | "url" | "doi" | "number" })
  | (FieldBase & { type: "slug"; sourceFields: string[] })
  | (FieldBase & { type: "select"; options: Option[] })
  | (FieldBase & { type: "month" })
  | (FieldBase & { type: "current"; endField: string })
  | (FieldBase & { type: "tags"; group: TagGroup })
  | (FieldBase & { type: "richtext" })
  | (FieldBase & { type: "authors" })
  | (FieldBase & { type: "relation" | "relations"; target: "projects" | "publications" });

export type AdminSectionKey =
  | "interests"
  | "education"
  | "publications"
  | "projects"
  | "experiences"
  | "teaching"
  | "skills"
  | "awards"
  | "activities";

export type SectionConfig = {
  key: AdminSectionKey;
  table: string;
  label: string;
  description: string;
  /** 목록에서 제목·부제로 보여 줄 컬럼 */
  titleField: string;
  subtitleFields: string[];
  fields: FieldDef[];
  /** 기간 검증: [시작, 종료] */
  dateRange?: [string, string];
  /** 첨부파일 대상 (F-01) */
  attachEntity?: "project" | "publication" | "experience";
  /** 업무 항목(사실 단위) 입력 (A-03) */
  itemsParent?: "project" | "experience";
  /** experiences 테이블을 경력/교육 경력으로 나눌 때 type 필터 */
  typeFilter?: { column: string; values: string[] };
  defaults?: Record<string, unknown>;
};

const opts = (rec: Record<string, string>): Option[] => Object.entries(rec).map(([value, label]) => ({ value, label }));

const period = (required = true): FieldDef[] => [
  { name: "start_date", label: "시작", type: "month", required, half: true },
  { name: "end_date", label: "종료", type: "month", half: true },
  { name: "is_current", label: "현재 진행 중", type: "current", endField: "end_date" },
];

/** 영문 주 필드 도움말: 비우면 /en 에 나오지 않는다 (P-10) */
const EN_REQUIRED_HELP = "비워 두면 영문 페이지(/en)에 이 항목이 나오지 않습니다.";

const NON_TEACHING_TYPES = ["RA", "intern", "job", "other"];
const TEACHING_TYPES = ["TA", "lecture"];

export const SECTIONS: Record<AdminSectionKey, SectionConfig> = {
  interests: {
    key: "interests",
    table: "research_interests",
    label: "연구 관심사",
    description: "주제별 짧은 설명과 관련 프로젝트·논문 연결",
    titleField: "title",
    subtitleFields: ["description"],
    fields: [
      { name: "title", label: "주제명", type: "text", required: true },
      { name: "title_en", label: "주제명 (영문)", type: "text", help: EN_REQUIRED_HELP },
      { name: "description", label: "설명", type: "textarea" },
      { name: "description_en", label: "설명 (영문)", type: "textarea" },
      { name: "project_ids", label: "관련 프로젝트", type: "relations", target: "projects" },
      { name: "publication_ids", label: "관련 논문·발표", type: "relations", target: "publications" },
    ],
  },

  education: {
    key: "education",
    table: "education",
    label: "학력",
    description: "학사·석사·박사 과정",
    titleField: "school",
    subtitleFields: ["major", "degree", "status"],
    dateRange: ["start_date", "end_date"],
    fields: [
      { name: "school", label: "학교", type: "text", required: true, half: true },
      { name: "school_en", label: "학교 (영문)", type: "text", half: true, help: "학교·전공 영문을 모두 채워야 영문 페이지에 나옵니다." },
      { name: "major", label: "전공", type: "text", required: true, half: true },
      { name: "major_en", label: "전공 (영문)", type: "text", half: true },
      {
        name: "degree",
        label: "학위",
        type: "select",
        required: true,
        half: true,
        options: opts({ 학사: "학사", 석사: "석사", 박사: "박사", 석박사통합: "석박사통합" }),
      },
      {
        name: "status",
        label: "상태",
        type: "select",
        required: true,
        half: true,
        options: opts({ 재학: "재학", 수료: "수료", 졸업: "졸업", 휴학: "휴학" }),
      },
      ...period(),
      { name: "advisor", label: "지도교수", type: "text", half: true },
      { name: "advisor_en", label: "지도교수 (영문)", type: "text", half: true },
      { name: "thesis_title", label: "학위논문 제목", type: "text" },
      { name: "thesis_title_en", label: "학위논문 제목 (영문)", type: "text" },
    ],
    defaults: { status: "재학", degree: "석사" },
  },

  publications: {
    key: "publications",
    table: "publications",
    label: "논문·학술발표",
    description: "학술지, 학위논문, 학회 발표, 연구보고서, 워킹페이퍼",
    titleField: "title",
    subtitleFields: ["venue", "year", "pub_status"],
    attachEntity: "publication",
    fields: [
      { name: "type", label: "유형", type: "select", required: true, half: true, options: opts(PUBLICATION_TYPE_LABEL) },
      { name: "pub_status", label: "상태", type: "select", required: true, half: true, options: opts(PUB_STATUS_LABEL) },
      { name: "title", label: "제목", type: "text", required: true },
      { name: "title_en", label: "제목 (영문)", type: "text", help: EN_REQUIRED_HELP },
      {
        name: "authors",
        label: "저자",
        type: "authors",
        required: true,
        help: "인용에 쓰일 순서대로 입력하고, 본인에 체크하면 굵게 표시됩니다. 영문 이름은 영문 페이지 인용에 쓰입니다.",
      },
      { name: "venue", label: "게재지·학회명·학교", type: "text", half: true },
      { name: "venue_en", label: "게재지·학회명·학교 (영문)", type: "text", half: true },
      { name: "year", label: "연도", type: "number", half: true, help: "준비 중·심사 중이면 비워 둘 수 있습니다." },
      { name: "volume", label: "권(Volume)", type: "text", half: true },
      { name: "issue", label: "호(Issue)", type: "text", half: true },
      { name: "pages", label: "페이지", type: "text", half: true, placeholder: "123-145" },
      { name: "doi", label: "DOI", type: "doi", half: true, placeholder: "10.1234/abcd.5678" },
      { name: "url", label: "URL", type: "url", placeholder: "https://" },
      { name: "abstract", label: "초록", type: "textarea" },
      { name: "abstract_en", label: "초록 (영문)", type: "textarea" },
      { name: "project_id", label: "관련 연구 프로젝트", type: "relation", target: "projects" },
      {
        name: "slug",
        label: "주소(slug)",
        type: "slug",
        required: true,
        sourceFields: ["title_en", "title"],
        help: "/publications/ 뒤에 붙는 주소. 영문 소문자·숫자·하이픈만 쓸 수 있습니다.",
      },
    ],
    defaults: { type: "journal", pub_status: "published", authors: [] },
  },

  projects: {
    key: "projects",
    table: "projects",
    label: "연구 프로젝트",
    description: "수행한 연구과제와 개인 연구 (포트폴리오)",
    titleField: "title",
    subtitleFields: ["org", "role"],
    dateRange: ["start_date", "end_date"],
    attachEntity: "project",
    itemsParent: "project",
    fields: [
      { name: "title", label: "제목", type: "text", required: true },
      { name: "title_en", label: "제목 (영문)", type: "text", help: EN_REQUIRED_HELP },
      {
        name: "slug",
        label: "주소(slug)",
        type: "slug",
        required: true,
        sourceFields: ["title_en", "title"],
        help: "/projects/ 뒤에 붙는 주소. 영문 소문자·숫자·하이픈만 쓸 수 있습니다.",
      },
      { name: "summary", label: "한 줄 요약", type: "textarea", help: "목록 카드와 검색 결과 설명에 쓰입니다." },
      { name: "summary_en", label: "한 줄 요약 (영문)", type: "textarea" },
      ...period(),
      { name: "org", label: "소속", type: "text", half: true },
      { name: "org_en", label: "소속 (영문)", type: "text", half: true },
      { name: "funder", label: "발주처·지원기관", type: "text", half: true },
      { name: "funder_en", label: "발주처·지원기관 (영문)", type: "text", half: true },
      {
        name: "role",
        label: "역할",
        type: "text",
        half: true,
        suggestions: ["연구보조원(RA)", "공동연구원", "책임연구원", "개인 연구"],
      },
      {
        name: "role_en",
        label: "역할 (영문)",
        type: "text",
        half: true,
        suggestions: ["Research Assistant", "Co-Investigator", "Principal Investigator", "Independent research"],
      },
      { name: "approach", label: "연구 방법 유형", type: "select", half: true, options: opts(APPROACH_LABEL) },
      { name: "research_question", label: "연구 질문", type: "richtext" },
      { name: "research_question_en", label: "연구 질문 (영문)", type: "richtext" },
      { name: "methods", label: "방법", type: "tags", group: "method", placeholder: "예: 패널 회귀분석, 심층면접" },
      { name: "methods_en", label: "방법 (영문)", type: "tags", group: "method_en", placeholder: "예: Panel regression" },
      { name: "data_sources", label: "데이터", type: "tags", group: "data", placeholder: "예: 한국복지패널" },
      { name: "data_sources_en", label: "데이터 (영문)", type: "tags", group: "data_en", placeholder: "예: Korea Welfare Panel Study" },
      { name: "findings", label: "결과", type: "richtext" },
      { name: "findings_en", label: "결과 (영문)", type: "richtext" },
      {
        name: "tools",
        label: "사용 도구",
        type: "tags",
        group: "tool",
        placeholder: "예: Stata, R, NVivo",
        help: "영문 페이지에는 한글이 없는 도구 이름만 표시됩니다.",
      },
      { name: "tags", label: "주제 태그", type: "tags", group: "topic" },
      { name: "tags_en", label: "주제 태그 (영문)", type: "tags", group: "topic_en", help: "영문 페이지의 주제 필터에 쓰입니다." },
    ],
    defaults: { methods: [], methods_en: [], data_sources: [], data_sources_en: [], tools: [], tags: [], tags_en: [] },
  },

  experiences: {
    key: "experiences",
    table: "experiences",
    label: "경력",
    description: "연구조교, 연구소 인턴, 이전 직장",
    titleField: "org",
    subtitleFields: ["title"],
    dateRange: ["start_date", "end_date"],
    attachEntity: "experience",
    itemsParent: "experience",
    typeFilter: { column: "type", values: NON_TEACHING_TYPES },
    fields: [
      { name: "org", label: "기관", type: "text", required: true, half: true },
      { name: "org_en", label: "기관 (영문)", type: "text", half: true, help: "기관·직함 영문을 모두 채워야 영문 페이지에 나옵니다." },
      { name: "title", label: "직함", type: "text", required: true, half: true },
      { name: "title_en", label: "직함 (영문)", type: "text", half: true },
      {
        name: "type",
        label: "유형",
        type: "select",
        required: true,
        half: true,
        options: NON_TEACHING_TYPES.map((v) => ({ value: v, label: EXPERIENCE_TYPE_LABEL[v as keyof typeof EXPERIENCE_TYPE_LABEL] })),
      },
      ...period(),
      { name: "description", label: "설명", type: "textarea", help: "구체적인 업무는 저장 후 아래 '업무 항목'에 한 줄씩 입력하세요." },
      { name: "description_en", label: "설명 (영문)", type: "textarea" },
    ],
    defaults: { type: "RA" },
  },

  teaching: {
    key: "teaching",
    table: "experiences",
    label: "교육 경력",
    description: "교육조교(TA), 강의",
    titleField: "course_name",
    subtitleFields: ["semester", "title"],
    dateRange: ["start_date", "end_date"],
    attachEntity: "experience",
    typeFilter: { column: "type", values: TEACHING_TYPES },
    fields: [
      { name: "course_name", label: "과목명", type: "text", required: true },
      { name: "course_name_en", label: "과목명 (영문)", type: "text", help: EN_REQUIRED_HELP },
      {
        name: "type",
        label: "유형",
        type: "select",
        required: true,
        half: true,
        options: TEACHING_TYPES.map((v) => ({ value: v, label: EXPERIENCE_TYPE_LABEL[v as keyof typeof EXPERIENCE_TYPE_LABEL] })),
      },
      { name: "title", label: "역할", type: "text", required: true, half: true, suggestions: ["교육조교", "강사", "튜터"] },
      {
        name: "title_en",
        label: "역할 (영문)",
        type: "text",
        half: true,
        suggestions: ["Teaching Assistant", "Instructor", "Tutor"],
      },
      { name: "org", label: "학교·기관", type: "text", required: true, half: true },
      { name: "org_en", label: "학교·기관 (영문)", type: "text", half: true },
      { name: "semester", label: "학기", type: "text", half: true, placeholder: "2026-1학기" },
      { name: "semester_en", label: "학기 (영문)", type: "text", half: true, placeholder: "Spring 2026" },
      { name: "supervisor", label: "담당 교수", type: "text", half: true },
      { name: "supervisor_en", label: "담당 교수 (영문)", type: "text", half: true },
      ...period(),
      { name: "description", label: "설명", type: "textarea" },
      { name: "description_en", label: "설명 (영문)", type: "textarea" },
    ],
    defaults: { type: "TA", title: "교육조교" },
  },

  skills: {
    key: "skills",
    table: "skills",
    label: "연구방법·역량",
    description: "근거 수와 최근 사용 시점은 프로젝트·업무 항목의 태그에서 자동 집계됩니다.",
    titleField: "name",
    subtitleFields: ["category"],
    fields: [
      {
        name: "name",
        label: "이름",
        type: "text",
        required: true,
        half: true,
        help: "프로젝트의 방법·도구·주제 태그와 철자가 같아야 근거로 집계됩니다.",
      },
      {
        name: "name_en",
        label: "이름 (영문)",
        type: "text",
        half: true,
        help: "비워 두면 이름에 한글이 없을 때(예: Stata)만 영문 페이지에 나옵니다.",
      },
      { name: "category", label: "분류", type: "select", required: true, half: true, options: opts(SKILL_CATEGORY_LABEL) },
      { name: "description", label: "설명", type: "textarea" },
      { name: "description_en", label: "설명 (영문)", type: "textarea" },
    ],
    defaults: { category: "quantitative" },
  },

  awards: {
    key: "awards",
    table: "awards",
    label: "수상·장학·연구비",
    description: "수상, 장학금, 연구비 수혜",
    titleField: "name",
    subtitleFields: ["org", "year"],
    fields: [
      { name: "name", label: "명칭", type: "text", required: true },
      { name: "name_en", label: "명칭 (영문)", type: "text", help: EN_REQUIRED_HELP },
      { name: "org", label: "수여 기관", type: "text", half: true },
      { name: "org_en", label: "수여 기관 (영문)", type: "text", half: true },
      { name: "amount", label: "금액 (선택)", type: "text", half: true, placeholder: "예: 500만 원" },
      { name: "amount_en", label: "금액 (영문)", type: "text", half: true, placeholder: "예: KRW 5,000,000" },
      { name: "year", label: "연도", type: "number", half: true },
      { name: "description", label: "설명", type: "textarea" },
      { name: "description_en", label: "설명 (영문)", type: "textarea" },
    ],
  },

  activities: {
    key: "activities",
    table: "activities",
    label: "학술활동",
    description: "학회 회원, 세미나·스터디, 심사",
    titleField: "name",
    subtitleFields: ["org", "role"],
    dateRange: ["start_date", "end_date"],
    fields: [
      { name: "name", label: "활동명", type: "text", required: true },
      { name: "name_en", label: "활동명 (영문)", type: "text", help: EN_REQUIRED_HELP },
      { name: "org", label: "단체", type: "text", half: true },
      { name: "org_en", label: "단체 (영문)", type: "text", half: true },
      { name: "role", label: "역할", type: "text", half: true },
      { name: "role_en", label: "역할 (영문)", type: "text", half: true },
      ...period(false),
    ],
  },
};

export const ADMIN_SECTION_ORDER: AdminSectionKey[] = [
  "interests",
  "publications",
  "projects",
  "education",
  "experiences",
  "teaching",
  "skills",
  "awards",
  "activities",
];

export function getSection(key: string): SectionConfig | null {
  return (SECTIONS as Record<string, SectionConfig>)[key] ?? null;
}

export const VISIBILITY_OPTIONS: Option[] = [
  { value: "draft", label: "초안 — 공개 페이지에 나오지 않음" },
  { value: "public", label: "공개" },
  { value: "private", label: "비공개 — 공개 페이지에 나오지 않음" },
];

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const DOI_RE = /^10\.\d{4,9}\/\S+$/;

export function normalizeDoi(v: string): string {
  return v.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
}

export function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** 영문 제목으로 slug 를 만든다. 영문이 없으면 빈 문자열. */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 8)
    .join("-");
}
