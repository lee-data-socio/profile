import Link from "next/link";
import { lang as rootLang } from "next/root-params";
import { getDict, isLang, localePath } from "@/lib/i18n";

export default async function NotFound() {
  const value = await rootLang();
  const lang = isLang(value) ? value : "ko";
  const t = getDict(lang).notFound;
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-start justify-center px-4 py-24 sm:px-6">
      <p className="text-sm text-subtle">404</p>
      <h1 className="mt-2 font-heading text-2xl font-bold">{t.heading}</h1>
      <p className="mt-2 text-muted">{t.body}</p>
      <Link href={localePath(lang, "/")} className="mt-6 text-accent hover:underline underline-offset-4">
        {t.home}
      </Link>
    </main>
  );
}
