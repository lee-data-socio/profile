import type { ReactNode } from "react";
import Link from "next/link";
import type { Publication } from "@/lib/types";
import { asaCitation, asaCitationText, authorParts, bibtex, doiUrl, venueDetail } from "@/lib/format";
import { getDict, localePath, type Lang } from "@/lib/i18n";
import { ExternalMark, PILL } from "@/components/ui";
import { CiteToggle } from "@/components/client/cite-toggle";

const isFinal = (p: Publication) => p.pub_status === "published" || p.pub_status === "presented";

/** ASA 인용문 (화면용: 끝의 DOI·URL 은 빼고 버튼으로 보여 준다). pub 은 localizePublication 을 거친 값 */
export function Citation({ pub, lang }: { pub: Publication; lang: Lang }) {
  return (
    <p className="leading-relaxed">
      {asaCitation(pub, lang, false).map((part, i) => {
        let node: ReactNode = part.text;
        if (part.bold) node = <strong className="font-bold text-fg">{node}</strong>;
        if (part.italic) node = <em>{node}</em>;
        return <span key={i}>{node}</span>;
      })}
    </p>
  );
}

/** 저자 목록 (본인 굵게) */
export function Authors({ pub, lang }: { pub: Publication; lang: Lang }) {
  return (
    <>
      {authorParts(pub, lang).map((part, i) =>
        part.bold ? (
          <strong key={i} className="font-semibold text-fg">
            {part.text}
          </strong>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

/** 게재지 + 권·호·쪽 */
export function Venue({ pub }: { pub: Publication }) {
  if (!pub.venue) return null;
  const detail = venueDetail(pub);
  return (
    <>
      <em>{pub.venue}</em>
      {detail && <span className="tabular-nums"> {detail}</span>}
    </>
  );
}

/** DOI / 원문 링크 버튼 */
export function SourceLinks({ pub, lang }: { pub: Publication; lang: Lang }) {
  const t = getDict(lang);
  return (
    <>
      {pub.doi && (
        <a href={doiUrl(pub.doi)} className={PILL} target="_blank" rel="noopener noreferrer">
          {t.viewDoi} <ExternalMark />
        </a>
      )}
      {!pub.doi && pub.url && (
        <a href={pub.url} className={PILL} target="_blank" rel="noopener noreferrer">
          {t.sourceLink} <ExternalMark />
        </a>
      )}
    </>
  );
}

export function StatusBadge({ pub, lang }: { pub: Publication; lang: Lang }) {
  if (isFinal(pub)) return null;
  return (
    <span className="inline-flex items-center rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
      {getDict(lang).pubStatus[pub.pub_status]}
    </span>
  );
}

export function citeLabels(lang: Lang) {
  const t = getDict(lang);
  return { cite: t.cite, ...t.copy };
}

/**
 * 논문 목록 한 줄. 왼쪽에 연도, 오른쪽에 제목 → 저자 → 게재지 → 버튼(DOI·인용) 순서.
 * showType: 유형별로 묶지 않은 목록(홈)에서 게재지 앞에 유형을 붙인다.
 */
export function PublicationItem({ pub, lang, showType = false }: { pub: Publication; lang: Lang; showType?: boolean }) {
  const t = getDict(lang);
  const venue = <Venue pub={pub} />;
  return (
    <li className="grid gap-x-6 gap-y-1 py-5 sm:grid-cols-[4.5rem_1fr]">
      <p className="text-sm tabular-nums text-subtle sm:pt-0.5">{pub.year ?? "—"}</p>
      <div className="min-w-0">
        <h3 className="font-heading text-[1.0625rem] font-bold leading-snug">
          <Link
            href={localePath(lang, `/publications/${pub.slug}`)}
            className="decoration-accent/40 underline-offset-4 hover:text-accent hover:underline"
          >
            {pub.title}
          </Link>
        </h3>
        <p className="mt-1.5 text-sm text-muted">
          <Authors pub={pub} lang={lang} />
        </p>
        {(showType || pub.venue) && (
          <p className="mt-0.5 text-sm text-muted">
            {showType && <span className="text-subtle">{t.pubType[pub.type]}</span>}
            {showType && pub.venue && <span className="text-subtle"> · </span>}
            {venue}
          </p>
        )}
        <CiteToggle asa={asaCitationText(pub, lang)} bibtex={bibtex(pub, lang)} labels={citeLabels(lang)}>
          <StatusBadge pub={pub} lang={lang} />
          <SourceLinks pub={pub} lang={lang} />
        </CiteToggle>
      </div>
    </li>
  );
}
