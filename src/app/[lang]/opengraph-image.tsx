import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/data";
import { getDict, isLang, localizeProfile } from "@/lib/i18n";

const size = { width: 1200, height: 630 };

/** 언어별 대체 텍스트를 주려고 generateImageMetadata 를 쓴다 (주소: /{lang}/opengraph-image/card) */
export function generateImageMetadata({ params }: { params: { lang: string } }) {
  const alt = getDict(isLang(params.lang) ? params.lang : "ko").ogImageAlt;
  return [{ id: "card", alt, size, contentType: "image/png" }];
}

/** 한글이 깨지지 않도록 필요한 글자만 담은 Noto Sans KR 서브셋을 Google Fonts 에서 받아 온다. */
async function loadFontBase64(text: string): Promise<string | null> {
  "use cache";
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(text)}`)
    ).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!src) return null;
    const res = await fetch(src[1]);
    return res.ok ? Buffer.from(await res.arrayBuffer()).toString("base64") : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const profile = localizeProfile(await getProfile(), isLang(lang) ? lang : "ko");
  const name = profile.name;
  const sub = [profile.name_en, profile.headline].filter(Boolean).join(" · ");
  const tags = profile.interests.slice(0, 4).join("  ·  ");
  const b64 = await loadFontBase64(`${name}${sub}${tags}`);
  const font = b64 ? Buffer.from(b64, "base64") : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          background: "#fbfaf7",
          color: "#1c1d1f",
          fontFamily: font ? "NotoSansKR" : "sans-serif",
        }}
      >
        <div style={{ width: 72, height: 6, background: "#1f4e79", marginBottom: 40 }} />
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -1 }}>{name}</div>
        {sub && <div style={{ fontSize: 34, marginTop: 20, color: "#5d6066" }}>{sub}</div>}
        {tags && <div style={{ fontSize: 26, marginTop: 48, color: "#1f4e79" }}>{tags}</div>}
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "NotoSansKR", data: font, weight: 700, style: "normal" }] : undefined,
    },
  );
}
