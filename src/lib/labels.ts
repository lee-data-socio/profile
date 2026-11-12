import type {
  Approach,
  AttachmentKind,
  ExperienceType,
  PubStatus,
  PublicationType,
  SectionKey,
  SectionOrderEntry,
  SkillCategory,
  Visibility,
} from "@/lib/types";

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  draft: "초안",
  public: "공개",
  private: "비공개",
};

export const SECTION_LABEL: Record<SectionKey, string> = {
  interests: "연구 관심사",
  education: "학력",
  publications: "논문·학술발표",
  projects: "연구 프로젝트",
  experiences: "경력",
  teaching: "교육 경력",
  skills: "연구방법·역량",
  awards: "수상·장학·연구비",
  activities: "학술활동",
  contact: "연락처",
};

/** 연구직 기준 기본 순서: 논문과 연구 프로젝트를 위로 */
export const DEFAULT_SECTION_ORDER: SectionOrderEntry[] = [
  { key: "interests", visible: true },
  { key: "publications", visible: true },
  { key: "projects", visible: true },
  { key: "education", visible: true },
  { key: "experiences", visible: true },
  { key: "teaching", visible: true },
  { key: "skills", visible: true },
  { key: "awards", visible: true },
  { key: "activities", visible: true },
  { key: "contact", visible: true },
];

/** 저장된 순서에 빠진 섹션이 있으면 뒤에 붙이고, 알 수 없는 키는 버린다. */
export function normalizeSectionOrder(saved: unknown): SectionOrderEntry[] {
  const known = new Set(DEFAULT_SECTION_ORDER.map((s) => s.key));
  const result: SectionOrderEntry[] = [];
  const seen = new Set<string>();
  if (Array.isArray(saved)) {
    for (const s of saved) {
      if (s && typeof s === "object" && known.has(s.key) && !seen.has(s.key)) {
        result.push({ key: s.key, visible: s.visible !== false });
        seen.add(s.key);
      }
    }
  }
  for (const s of DEFAULT_SECTION_ORDER) if (!seen.has(s.key)) result.push(s);
  return result;
}

export const PUBLICATION_TYPE_LABEL: Record<PublicationType, string> = {
  journal: "학술지 논문",
  thesis: "학위논문",
  conference: "학술대회 발표",
  report: "연구보고서",
  working_paper: "워킹페이퍼",
  book_chapter: "단행본·챕터",
};

export const PUBLICATION_TYPE_ORDER: PublicationType[] = [
  "journal",
  "book_chapter",
  "thesis",
  "working_paper",
  "report",
  "conference",
];

export const PUB_STATUS_LABEL: Record<PubStatus, string> = {
  published: "게재",
  accepted: "게재 확정",
  under_review: "심사 중",
  in_preparation: "준비 중",
  presented: "발표",
};

export const APPROACH_LABEL: Record<Approach, string> = {
  quantitative: "양적",
  qualitative: "질적",
  mixed: "혼합",
};

export const EXPERIENCE_TYPE_LABEL: Record<ExperienceType, string> = {
  RA: "연구조교",
  TA: "교육조교",
  intern: "인턴",
  job: "직장",
  lecture: "강의",
  other: "기타",
};

export const TEACHING_TYPES: ExperienceType[] = ["TA", "lecture"];

export const SKILL_CATEGORY_LABEL: Record<SkillCategory, string> = {
  quantitative: "양적 방법",
  qualitative: "질적 방법",
  survey_design: "조사설계",
  tool: "도구",
  language: "언어",
};

export const ATTACHMENT_KIND_LABEL: Record<AttachmentKind, string> = {
  paper: "논문 원문",
  report: "보고서",
  slides: "발표자료",
  poster: "포스터",
  questionnaire: "설문지",
  codebook: "코드북",
  cv: "CV",
  other: "기타",
};

export const VERSION_TYPE_LABEL = {
  published: "게재본",
  preprint: "저자 원고(프리프린트)",
} as const;
