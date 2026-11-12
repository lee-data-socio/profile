import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { getOwner } from "@/lib/auth";
import { ATTACHMENT_BUCKET, isSupabaseConfigured } from "@/lib/env";

/** 서명 URL 유효 시간(초). PRD: 1시간 이내 */
const SIGNED_URL_TTL = 60 * 10;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function notFound() {
  return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

/**
 * 첨부파일 다운로드·미리보기 (F-06).
 * - 공개 파일 + 공개 항목: 누구나
 * - 그 외: 관리자 로그인 상태에서만
 * 모든 파일은 비공개 버킷에 있고, 짧은 서명 URL 로 리다이렉트한다.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/files/[id]">) {
  await connection();
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return notFound();
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new NextResponse("Storage is not configured", { status: 503 });
  }

  const db = adminClient();
  const { data: file } = await db
    .from("attachments")
    .select("id, entity_type, entity_id, storage_path, original_name, visibility")
    .eq("id", id)
    .maybeSingle();
  if (!file) return notFound();

  let allowed = false;
  if (file.visibility === "public") {
    const { data: isPublic } = await db.rpc("entity_is_public", {
      p_type: file.entity_type,
      p_id: file.entity_id,
    });
    allowed = Boolean(isPublic);
  }
  if (!allowed) allowed = Boolean(await getOwner());
  // 존재 여부를 숨기기 위해 권한이 없어도 404
  if (!allowed) return notFound();

  const inline = request.nextUrl.searchParams.get("inline") === "1";
  const { data: signed, error } = await db.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(file.storage_path, SIGNED_URL_TTL, inline ? undefined : { download: file.original_name });
  if (error || !signed) return notFound();

  return NextResponse.redirect(signed.signedUrl, {
    status: 302,
    headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" },
  });
}
