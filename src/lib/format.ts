import type { Author, Publication } from "@/lib/types";
import { getDict, hasHangul, type Lang } from "@/lib/i18n";

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-01" → "2026.09" (영어: "Sep 2026") */
export function formatMonth(date: string | null | undefined, lang: Lang = "ko"): string {
  if (!date) return "";
  const [y, m] = date.split("-");
  if (!m) return y;
  return lang === "en" ? `${MONTHS_EN[Number(m) - 1] ?? m} ${y}` : `${y}.${m}`;
}

export function formatPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
  isCurrent?: boolean,
  lang: Lang = "ko",
): string {
  const s = formatMonth(start, lang);
  const e = isCurrent ? getDict(lang).present : formatMonth(end, lang);
  if (!s && !e) return "";
  if (!e || s === e) return s;
  return `${s} – ${e}`;
}

/** "2026-11-12T03:00:00Z" → "2026년 11월 12일" / "November 12, 2026" (한국 시간 기준) */
export function formatDate(iso: string | null | undefined, lang: Lang = "ko"): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** "YYYY-MM" (input[type=month]) ↔ "YYYY-MM-01" (date 컬럼) */
export function monthToDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : null;
}

export function dateToMonth(value: string | null | undefined): string {
  return value ? value.slice(0, 7) : "";
}

/** 잘못된 % 인코딩이면 빈 문자열 (→ 404) */
export function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return "";
  }
}

export function doiUrl(doi: string): string {
  return `https://doi.org/${doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`;
}

/* ------------------------------------------------------------------ */
/* ASA 인용 형식                                                       */
/* ------------------------------------------------------------------ */

export type CitationPart = { text: string; bold?: boolean; italic?: boolean };

function joinAuthors(authors: Author[], lang: Lang): CitationPart[] {
  const names = authors.filter((a) => a.name.trim());
  const parts: CitationPart[] = [];
  // 한국어 페이지에서 저자가 모두 한글 이름이면 국내 학술지 관례대로 "이상원·박효민"
  const korean = lang === "ko" && names.every((a) => hasHangul(a.name));
  names.forEach((a, i) => {
    if (i > 0) {
      parts.push({
        text: korean ? "·" : i === names.length - 1 ? (names.length > 2 ? ", and " : " and ") : ", ",
      });
    }
    parts.push({ text: a.name.trim(), bold: Boolean(a.is_me) });
  });
  return parts;
}

function yearText(p: Publication, lang: Lang): string {
  if (p.pub_status === "published" || p.pub_status === "presented") {
    return p.year ? String(p.year) : "n.d.";
  }
  const label = getDict(lang).pubStatus[p.pub_status];
  // ASA(영문)에서는 게재 확정을 연도 없이 "Forthcoming" 으로 쓴다
  return p.year && p.pub_status === "accepted" && lang === "ko" ? `${p.year}(${label})` : label;
}

/** 저자 목록만 (본인 bold) */
export function authorParts(p: Publication, lang: Lang = "ko"): CitationPart[] {
  return joinAuthors(p.authors, lang);
}

/** 게재지 뒤에 붙는 권·호·쪽 ("25(57):1–37"). 게재지가 없으면 빈 문자열 */
export function venueDetail(p: Publication): string {
  if (!p.venue) return "";
  let out = "";
  if (p.volume) out += p.volume;
  if (p.issue) out += `(${p.issue})`;
  if (p.pages) out += `${out ? ":" : "pp. "}${p.pages.replace(/\s*-\s*/g, "–")}`;
  return out;
}

/**
 * ASA(American Sociological Association) 스타일 인용문을 조각 배열로 만든다.
 * 본인 이름은 bold, 게재지는 italic 으로 표시된다.
 * withLink=false 면 화면용으로 끝의 DOI·URL 을 뺀다 (링크는 버튼으로 따로 보여 준다).
 */
export function asaCitation(p: Publication, lang: Lang = "ko", withLink = true): CitationPart[] {
  const parts: CitationPart[] = [...joinAuthors(p.authors, lang)];
  parts.push({ text: `. ${yearText(p, lang)}. ` });

  const quotedTitle = `“${p.title}.”`;
  switch (p.type) {
    case "journal": {
      parts.push({ text: `${quotedTitle} ` });
      // 게재지가 없으면(영문 페이지에서 한글 게재지가 빠진 경우 등) 권·호·쪽만 남지 않게 함께 생략
      if (!p.venue) break;
      parts.push({ text: p.venue, italic: true });
      let tail = "";
      if (p.volume) tail += ` ${p.volume}`;
      if (p.issue) tail += `(${p.issue})`;
      if (p.pages) tail += `${p.volume || p.issue ? ":" : " "}${p.pages}`;
      parts.push({ text: `${tail}.` });
      break;
    }
    case "book_chapter": {
      parts.push({ text: `${quotedTitle} ` });
      if (!p.venue) break;
      parts.push({ text: `In `}, { text: p.venue, italic: true });
      parts.push({ text: p.pages ? `, pp. ${p.pages}.` : "." });
      break;
    }
    case "thesis":
      parts.push({ text: `${quotedTitle} ` });
      parts.push({ text: p.venue ? `${p.venue}.` : "" });
      break;
    case "conference":
      parts.push({ text: `${quotedTitle} ` });
      parts.push({ text: p.venue ? `Paper presented at ${p.venue}.` : "" });
      break;
    default:
      parts.push({ text: `${quotedTitle} ` });
      parts.push({ text: p.venue ? `${p.venue}.` : "" });
  }

  if (!withLink) return parts.filter((x) => x.text);
  if (p.doi) parts.push({ text: ` doi:${p.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}.` });
  else if (p.url) parts.push({ text: ` ${p.url}` });
  return parts.filter((x) => x.text);
}

export function asaCitationText(p: Publication, lang: Lang = "ko"): string {
  return asaCitation(p, lang)
    .map((x) => x.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* BibTeX                                                              */
/* ------------------------------------------------------------------ */

const BIBTEX_TYPE: Record<Publication["type"], string> = {
  journal: "article",
  thesis: "mastersthesis",
  conference: "inproceedings",
  report: "techreport",
  working_paper: "unpublished",
  book_chapter: "incollection",
};

function bibEscape(s: string): string {
  return s.replace(/[{}]/g, "").replace(/([&%$#_])/g, "\\$1");
}

export function bibtex(p: Publication, lang: Lang = "ko"): string {
  const firstAuthor = p.authors[0]?.name.split(/[\s,]+/).filter(Boolean).pop() ?? "anon";
  const key = `${firstAuthor.toLowerCase().replace(/[^a-z0-9]/g, "") || "ref"}${p.year ?? ""}${p.slug.split("-")[0] ?? ""}`;
  const fields: [string, string | null | undefined][] = [
    ["author", p.authors.map((a) => a.name.trim()).filter(Boolean).join(" and ")],
    ["title", p.title],
    [
      p.type === "journal"
        ? "journal"
        : p.type === "conference" || p.type === "book_chapter"
          ? "booktitle"
          : p.type === "thesis"
            ? "school"
            : "institution",
      p.venue,
    ],
    ["year", p.year ? String(p.year) : null],
    ["volume", p.volume],
    ["number", p.issue],
    ["pages", p.pages?.replace(/-/g, "--")],
    ["doi", p.doi?.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")],
    ["url", p.doi ? null : p.url],
    ["note", p.pub_status !== "published" && p.pub_status !== "presented" ? getDict(lang).pubStatus[p.pub_status] : null],
  ];
  const body = fields
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${k} = {${bibEscape(v!)}}`)
    .join(",\n");
  return `@${BIBTEX_TYPE[p.type]}{${key},\n${body}\n}`;
}
