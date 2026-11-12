import type { AttachmentKind } from "@/lib/types";

/** PRD F-02 허용 형식. 확장자 기준으로 판단한다 (HWP 는 브라우저가 MIME 을 비워 보내는 경우가 많음). */
export const ALLOWED_EXTENSIONS: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  hwp: "application/x-hwp",
  hwpx: "application/vnd.hancom.hwpx",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export const ACCEPT_ATTRIBUTE = Object.keys(ALLOWED_EXTENSIONS)
  .map((e) => `.${e}`)
  .join(",");

export function extensionOf(name: string): string {
  const m = /\.([A-Za-z0-9]+)$/.exec(name);
  return m ? m[1].toLowerCase() : "";
}

export function mimeFor(name: string): string | null {
  return ALLOWED_EXTENSIONS[extensionOf(name)] ?? null;
}

export function isPdf(mime: string) {
  return mime === "application/pdf";
}

export function isImage(mime: string) {
  return mime.startsWith("image/");
}

/** 파일 종류 표시용 짧은 라벨 */
export function fileTypeLabel(name: string): string {
  return extensionOf(name).toUpperCase() || "FILE";
}

/**
 * 저장 경로용 안전한 파일명. 한글 등 ASCII 밖 문자는 "_" 로 바꾸고 확장자는 유지한다.
 * 원래 이름은 DB(original_name)에 따로 저장했다가 다운로드할 때 돌려준다.
 */
export function safeStorageName(name: string): string {
  const ext = extensionOf(name);
  const base = ext ? name.slice(0, -(ext.length + 1)) : name;
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 80);
  return `${cleaned || "file"}${ext ? `.${ext}` : ""}`;
}

export function guessKind(name: string): AttachmentKind {
  const ext = extensionOf(name);
  if (ext === "pptx") return "slides";
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "poster";
  if (/cv|이력서/i.test(name)) return "cv";
  if (/codebook|코드북/i.test(name)) return "codebook";
  if (/설문|questionnaire|survey/i.test(name)) return "questionnaire";
  if (/보고서|report/i.test(name)) return "report";
  if (ext === "pdf") return "paper";
  return "other";
}

export function stripExtension(name: string): string {
  const ext = extensionOf(name);
  return ext ? name.slice(0, -(ext.length + 1)) : name;
}
