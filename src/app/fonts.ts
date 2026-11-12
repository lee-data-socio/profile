import type { Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";

/** 루트 레이아웃이 공개([lang])·관리자(admin) 둘이라 글꼴과 viewport 를 여기서 함께 쓴다. */
export const sans = Noto_Sans_KR({
  variable: "--font-sans-kr",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

export const rootViewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#121315" },
  ],
};
