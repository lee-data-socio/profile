import type { ReactNode } from "react";
import type { RichDoc } from "@/lib/types";

/**
 * Tiptap JSON → React. dangerouslySetInnerHTML 을 쓰지 않고 허용된 노드·마크만 그린다.
 */
function safeHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  const v = href.trim();
  if (/^(https?:|mailto:)/i.test(v) || v.startsWith("/") || v.startsWith("#")) return v;
  return null;
}

function renderText(node: RichDoc, key: number): ReactNode {
  let out: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold":
        out = <strong>{out}</strong>;
        break;
      case "italic":
        out = <em>{out}</em>;
        break;
      case "underline":
        out = <u>{out}</u>;
        break;
      case "strike":
        out = <s>{out}</s>;
        break;
      case "code":
        out = <code>{out}</code>;
        break;
      case "link": {
        const href = safeHref(mark.attrs?.href);
        if (href) {
          const external = /^https?:/i.test(href);
          out = (
            <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {out}
            </a>
          );
        }
        break;
      }
    }
  }
  return <span key={key}>{out}</span>;
}

function renderNode(node: RichDoc, key: number): ReactNode {
  const children = node.content?.map((c, i) => renderNode(c, i));
  switch (node.type) {
    case "doc":
      return <>{children}</>;
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "heading": {
      const level = Number(node.attrs?.level) === 3 ? 3 : 2;
      // 페이지 h1/h2 구조를 해치지 않게 한 단계씩 내린다
      return level === 2 ? <h3 key={key}>{children}</h3> : <h4 key={key}>{children}</h4>;
    }
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return <ol key={key}>{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "hardBreak":
      return <br key={key} />;
    case "text":
      return renderText(node, key);
    default:
      return children ? <span key={key}>{children}</span> : null;
  }
}

export function isRichEmpty(doc: RichDoc | null | undefined): boolean {
  return !doc || richToPlain(doc).trim() === "";
}

export function richToPlain(doc: RichDoc | null | undefined): string {
  if (!doc) return "";
  if (doc.type === "text") return doc.text ?? "";
  const inner = (doc.content ?? []).map(richToPlain).join(doc.type === "doc" ? "\n" : "");
  return ["paragraph", "heading", "listItem"].includes(doc.type) ? `${inner} ` : inner;
}

export function RichText({ doc, className = "" }: { doc: RichDoc | null | undefined; className?: string }) {
  if (isRichEmpty(doc)) return null;
  return <div className={`prose-content ${className}`}>{renderNode(doc!, 0)}</div>;
}
