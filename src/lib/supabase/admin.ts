import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * service role 클라이언트. RLS를 우회하므로 서버에서, 관리자 확인 뒤에만 사용한다.
 * 절대 클라이언트 컴포넌트에서 import 하지 않는다 ("server-only" 가 빌드 단계에서 막아 준다).
 */
export function adminClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.");
  }
  if (!client) {
    client = createClient(SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    });
  }
  return client;
}
