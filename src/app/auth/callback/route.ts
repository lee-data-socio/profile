import { NextResponse, type NextRequest } from "next/server";
import { sessionClient } from "@/lib/supabase/server";
import { isOwnerUser } from "@/lib/auth";

/** 매직링크 클릭 후 돌아오는 곳. code 를 세션으로 바꾸고, 관리자가 아니면 바로 로그아웃한다. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const login = new URL("/admin/login", url.origin);

  if (!code) {
    login.searchParams.set("error", "link");
    return NextResponse.redirect(login);
  }

  const supabase = await sessionClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    login.searchParams.set("error", "link");
    return NextResponse.redirect(login);
  }
  if (!isOwnerUser(data.user)) {
    await supabase.auth.signOut();
    login.searchParams.set("error", "owner");
    return NextResponse.redirect(login);
  }
  return NextResponse.redirect(new URL("/admin", url.origin));
}
