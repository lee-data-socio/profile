import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 pt-10 sm:px-6 sm:pt-14">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
