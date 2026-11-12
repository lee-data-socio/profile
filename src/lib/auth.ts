import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { sessionClient } from "@/lib/supabase/server";

export function isOwnerEmail(email: string | null | undefined): boolean {
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  return Boolean(owner && email && email.trim().toLowerCase() === owner);
}

/**
 * 관리자 판정. 이메일이 같아도 인증(확인)되지 않은 계정은 거부한다.
 * (anon 키로 누군가 OWNER_EMAIL 로 직접 가입해 두는 경우 대비)
 * OWNER_USER_ID 가 설정돼 있으면 사용자 id 까지 고정한다.
 */
export function isOwnerUser(user: { id: string; email?: string | null; email_confirmed_at?: string | null } | null | undefined): boolean {
  if (!user || !isOwnerEmail(user.email) || !user.email_confirmed_at) return false;
  const pinned = process.env.OWNER_USER_ID?.trim();
  return !pinned || pinned === user.id;
}

/** 현재 로그인한 사용자가 관리자면 이메일을, 아니면 null 을 돌려준다. */
export async function getOwner(): Promise<{ email: string } | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await sessionClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return isOwnerUser(data.user) ? { email: data.user.email! } : null;
}

/** 관리자 페이지·서버 액션 첫 줄에서 호출한다. proxy 와 별개로 매번 다시 확인한다. */
export async function requireOwner(): Promise<{ email: string }> {
  const owner = await getOwner();
  if (!owner) redirect("/admin/login");
  return owner;
}

/**
 * 관리자 페이지 첫 줄에서 호출. 요청 시점 렌더링으로 고정하고(빌드 때 미리 그리지 않음) 관리자를 확인한다.
 */
export async function adminPage(): Promise<{ email: string }> {
  await connection();
  return requireOwner();
}
