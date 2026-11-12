import { isLang } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang: value } = await params;
  const lang = isLang(value) ? value : "ko";
  return (
    <>
      <SiteHeader lang={lang} />
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 pt-10 sm:px-6 sm:pt-14">
        {children}
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
