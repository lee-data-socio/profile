import type { ReactNode } from "react";
import Link from "next/link";
import type { Publication } from "@/lib/types";
import { asaCitation, asaCitationText, bibtex, doiUrl } from "@/lib/format";
import { PUB_STATUS_LABEL } from "@/lib/labels";
import { CopyButton } from "@/components/client/copy-button";

export function Citation({ pub, linkTitle = true }: { pub: Publication; linkTitle?: boolean }) {
  const parts = asaCitation(pub);
  return (
    <p className="leading-relaxed">
      {parts.map((part, i) => {
        let node: ReactNode = part.text;
        if (part.bold) node = <strong className="font-bold">{node}</strong>;
        if (part.italic) node = <em>{node}</em>;
        // 제목 조각에 상세 페이지 링크
        if (linkTitle && part.text.startsWith("“")) {
          node = (
            <Link href={`/publications/${pub.slug}`} className="hover:text-accent hover:underline underline-offset-4">
              {node}
            </Link>
          );
        }
        return <span key={i}>{node}</span>;
      })}
    </p>
  );
}

export function PublicationItem({ pub }: { pub: Publication }) {
  return (
    <li className="py-3">
      <Citation pub={pub} />
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-subtle">
        {pub.pub_status !== "published" && pub.pub_status !== "presented" && (
          <span className="rounded bg-accent-soft px-1.5 py-0.5 text-accent">{PUB_STATUS_LABEL[pub.pub_status]}</span>
        )}
        {pub.doi && (
          <a href={doiUrl(pub.doi)} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
            DOI
          </a>
        )}
        {!pub.doi && pub.url && (
          <a href={pub.url} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
            링크
          </a>
        )}
        <CopyButton text={asaCitationText(pub)} label="ASA 복사" />
        <CopyButton text={bibtex(pub)} label="BibTeX 복사" />
      </div>
    </li>
  );
}
