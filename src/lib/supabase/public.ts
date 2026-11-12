import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * 공개 페이지용 익명 클라이언트. 쿠키를 읽지 않으므로 페이지가 정적으로 생성된다.
 * RLS 때문에 visibility = 'public' 인 행만 돌려받는다.
 */
export function publicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Next 의 fetch 캐시(.next/cache/fetch-cache)는 빌드 간에도 남아, 재배포 때 예전 DB 내용으로
      // 페이지를 만들 수 있다. 캐싱은 data.ts 의 "use cache" + updateTag 로만 관리한다.
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    });
  }
  return client;
}
