import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getOwner } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";

const TABLES = [
  "profile",
  "research_interests",
  "education",
  "publications",
  "projects",
  "experiences",
  "entry_items",
  "skills",
  "awards",
  "activities",
  "attachments",
];

/** 전체 데이터 JSON 내보내기 (A-12, 백업). 첨부파일 본문은 Storage 에 그대로 있으므로 메타데이터만 담는다. */
export async function GET() {
  await connection();
  if (!(await getOwner())) return new NextResponse("Unauthorized", { status: 401 });
  const db = adminClient();
  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), version: 1 };
  for (const t of TABLES) {
    const { data, error } = await db.from(t).select("*").order("created_at");
    if (error) return new NextResponse(`${t}: ${error.message}`, { status: 500 });
    out[t] = data;
  }
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="profile-backup-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
