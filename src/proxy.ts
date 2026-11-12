import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * /admin 경로 보호 (A-01). 세션 쿠키를 갱신하고, 로그인하지 않았거나 OWNER_EMAIL 이 아니면
 * 로그인 화면으로 보낸다. 실제 권한 확인은 각 페이지·서버 액션의 requireOwner() 가 다시 한다.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isLogin = request.nextUrl.pathname.startsWith("/admin/login");

  if (!url || !key) {
    return isLogin ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login?error=config", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const pinned = process.env.OWNER_USER_ID?.trim();
  const user = data.user;
  // src/lib/auth.ts 의 isOwnerUser 와 같은 규칙 (proxy 는 server-only 모듈을 쓰지 않도록 따로 둠)
  const isOwner = Boolean(
    owner && user?.email?.toLowerCase() === owner && user.email_confirmed_at && (!pinned || pinned === user.id),
  );

  if (!isOwner && !isLogin) {
    const login = new URL("/admin/login", request.url);
    return NextResponse.redirect(login);
  }
  if (isOwner && isLogin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
