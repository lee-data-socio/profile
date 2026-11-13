export type Visibility = "draft" | "public" | "private";

/** Tiptap JSON 문서 */
export type RichDoc = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichDoc[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

type Base = {
  id: string;
  visibility: Visibility;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SectionKey =
  | "interests"
  | "education"
  | "publications"
  | "projects"
  | "experiences"
  | "teaching"
  | "skills"
  | "awards"
  | "activities"
  | "contact";

export type SectionOrderEntry = { key: SectionKey; visible: boolean };

export type Contacts = {
  email?: string;
  scholar?: string;
  orcid?: string;
  researchgate?: string;
  github?: string;
  linkedin?: string;
  website?: string;
};

export type Profile = Base & {
  name: string;
  name_en: string | null;
  headline: string | null;
  headline_en: string | null;
  bio: RichDoc | null;
  bio_en: RichDoc | null;
  interests: string[];
  /** 0002_english_fields.sql 실행 전에는 없을 수 있다 */
  interests_en?: string[];
  /** 헤더에 보이는 사이트 이름. 0003_site_title.sql 실행 전에는 없다 */
  site_title?: string | null;
  site_title_en?: string | null;
  contacts: Contacts;
  photo_path: string | null;
  cv_attachment_id: string | null;
  section_order: SectionOrderEntry[];
};

export type ResearchInterest = Base & {
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  project_ids: string[];
  publication_ids: string[];
};

export type Education = Base & {
  school: string;
  school_en: string | null;
  major: string;
  major_en: string | null;
  degree: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  status: string;
  advisor: string | null;
  advisor_en?: string | null;
  thesis_title: string | null;
  thesis_title_en: string | null;
};

export type Author = { name: string; name_en?: string; is_me?: boolean };

export type PublicationType =
  | "journal"
  | "thesis"
  | "conference"
  | "report"
  | "working_paper"
  | "book_chapter";

export type PubStatus = "published" | "accepted" | "under_review" | "in_preparation" | "presented";

export type Publication = Base & {
  slug: string;
  type: PublicationType;
  authors: Author[];
  title: string;
  title_en: string | null;
  venue: string | null;
  venue_en?: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  year: number | null;
  pub_status: PubStatus;
  doi: string | null;
  url: string | null;
  abstract: string | null;
  abstract_en: string | null;
  project_id: string | null;
};

export type Approach = "quantitative" | "qualitative" | "mixed";

export type Project = Base & {
  slug: string;
  title: string;
  title_en: string | null;
  summary: string | null;
  summary_en: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  org: string | null;
  org_en?: string | null;
  funder: string | null;
  funder_en?: string | null;
  role: string | null;
  role_en?: string | null;
  approach: Approach | null;
  research_question: RichDoc | null;
  research_question_en?: RichDoc | null;
  methods: string[];
  methods_en?: string[];
  data_sources: string[];
  data_sources_en?: string[];
  findings: RichDoc | null;
  findings_en?: RichDoc | null;
  tools: string[];
  tags: string[];
  tags_en?: string[];
};

export type ExperienceType = "RA" | "TA" | "intern" | "job" | "lecture" | "other";

export type Experience = Base & {
  org: string;
  org_en: string | null;
  title: string;
  title_en: string | null;
  type: ExperienceType;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  description_en: string | null;
  course_name: string | null;
  course_name_en?: string | null;
  semester: string | null;
  semester_en?: string | null;
  supervisor: string | null;
  supervisor_en?: string | null;
};

export type EntryItem = Base & {
  parent_type: "project" | "experience";
  parent_id: string;
  text: string;
  text_en: string | null;
  metrics: string[];
  metrics_en?: string[];
  evidence_url: string | null;
  tags: string[];
  last_used: string | null;
};

export type SkillCategory = "quantitative" | "qualitative" | "survey_design" | "tool" | "language";

export type Skill = Base & {
  name: string;
  name_en?: string | null;
  category: SkillCategory;
  description: string | null;
  description_en: string | null;
};

export type SkillStat = {
  id: string;
  name: string;
  category: SkillCategory;
  evidence_count: number;
  first_used: string | null;
  last_used: string | null;
};

export type Award = Base & {
  name: string;
  name_en: string | null;
  org: string | null;
  org_en?: string | null;
  year: number | null;
  amount: string | null;
  amount_en?: string | null;
  description: string | null;
  description_en?: string | null;
};

export type Activity = Base & {
  name: string;
  name_en: string | null;
  org: string | null;
  org_en?: string | null;
  role: string | null;
  role_en?: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
};

export type EntityType = "project" | "publication" | "experience" | "profile";

export type AttachmentKind =
  | "paper"
  | "report"
  | "slides"
  | "poster"
  | "questionnaire"
  | "codebook"
  | "cv"
  | "other";

export type Attachment = Base & {
  entity_type: EntityType;
  entity_id: string;
  storage_path: string;
  display_name: string;
  display_name_en?: string | null;
  original_name: string;
  description: string | null;
  description_en?: string | null;
  kind: AttachmentKind;
  mime: string;
  size_bytes: number;
  version_type: "published" | "preprint" | null;
  ethics_checked: boolean;
};
