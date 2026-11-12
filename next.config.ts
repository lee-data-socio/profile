import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // 프로필 사진(avatars 공개 버킷)
    // 이 프로젝트의 Supabase 공개 버킷만 허용
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/avatars/**" }]
      : [],
  },
  experimental: {
    // 루트 레이아웃이 공개(app/[lang])·관리자(app/admin) 둘이라, 어떤 경로와도 맞지 않는 주소는 app/global-not-found.tsx 로
    globalNotFound: true,
  },
  // 한/영 전환 (P-10): 한국어는 접두어 없는 주소가 정식이고 내부적으로 app/[lang] 의 lang=ko 로 렌더링한다.
  // 영어는 /en 아래 그대로. /ko 로 직접 들어오면 중복 주소가 생기지 않게 접두어 없는 주소로 보낸다.
  async redirects() {
    return [
      { source: "/ko", destination: "/", permanent: true },
      // OG 이미지(/ko/opengraph-image/…)는 메타태그가 이 주소를 가리키므로 그대로 둔다
      { source: "/ko/:path((?!opengraph-image(?:/|$)).*)", destination: "/:path", permanent: true },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        { source: "/", destination: "/ko" },
        // /projects, /publications … (afterFiles 라 sitemap.xml·robots.txt 같은 정적 경로는 먼저 처리된다).
        // 없는 주소도 /ko 아래로 보내 [lang] 에 엉뚱한 값(/foo → lang=foo)이 들어가지 않게 한다.
        { source: "/:path((?!(?:en|ko|admin|api|auth|_next|_vercel)(?:/|$)).+)", destination: "/ko/:path" },
      ],
      // 어떤 페이지와도 맞지 않는 /ko/…, /en/… 는 언어별 404 페이지로
      fallback: [{ source: "/:lang(ko|en)/:path+", destination: "/:lang/missing" }],
    };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
