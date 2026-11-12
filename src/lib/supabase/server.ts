import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/** 로그인 세션(쿠키)을 읽고 쓰는 서버 클라이언트. 인증 확인 용도로만 사용한다. */
export async function sessionClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 서버 컴포넌트에서 호출되면 쿠키를 쓸 수 없다. proxy 가 세션을 갱신하므로 무시해도 된다.
        }
      },
    },
  });
}
