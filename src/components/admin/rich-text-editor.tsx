"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { useState } from "react";
import type { RichDoc } from "@/lib/types";

/** 본문 편집기 (A-05): 제목, 목록, 굵게, 기울임, 링크. 결과는 JSON 으로 저장한다. */
export function RichTextEditor({
  id,
  name,
  initial,
  placeholder,
  invalid,
}: {
  id: string;
  name: string;
  initial: RichDoc | null;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [json, setJson] = useState<string>(initial ? JSON.stringify(initial) : "");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
        },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "내용을 입력하세요" }),
    ],
    content: initial ?? "",
    editorProps: {
      attributes: {
        id,
        class: "prose-content tiptap px-3 py-2 text-sm",
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: ({ editor }) => setJson(editor.isEmpty ? "" : JSON.stringify(editor.getJSON())),
  });

  return (
    <div
      className={`overflow-hidden rounded-md border bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 ${
        invalid ? "border-danger" : "border-line"
      }`}
    >
      <input type="hidden" name={name} value={json} />
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return <div className="h-9 border-b border-line" />;
  const btn = (active: boolean) =>
    `rounded px-2 py-1 text-xs font-medium ${active ? "bg-accent-soft text-accent" : "text-muted hover:bg-line/60"}`;
  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 주소 (비우면 링크 해제)", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "" || url.trim() === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };
  return (
    <div role="toolbar" aria-label="서식" className="flex flex-wrap gap-0.5 border-b border-line bg-bg px-1.5 py-1">
      <button type="button" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        제목
      </button>
      <button type="button" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        소제목
      </button>
      <span className="mx-1 w-px bg-line" aria-hidden />
      <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="굵게">
        <strong>B</strong>
      </button>
      <button type="button" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="기울임">
        <em>I</em>
      </button>
      <button type="button" className={btn(editor.isActive("link"))} onClick={setLink}>
        링크
      </button>
      <span className="mx-1 w-px bg-line" aria-hidden />
      <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • 목록
      </button>
      <button type="button" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. 목록
      </button>
    </div>
  );
}
