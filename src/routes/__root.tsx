import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/sonner";
import { hydrateDemoStore } from "@/lib/data/local-store";
import { I18nProvider, useI18n } from "@/lib/i18n/i18n";
import { Button } from "@/components/ui/button";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return <I18nProvider><ServiceError notFound /></I18nProvider>;
}

function ServiceError({ notFound = false, retry }: { notFound?: boolean; retry?: () => void }) {
  const { tr, lang, setLang } = useI18n();
  return <div className="grid min-h-screen place-items-center px-4"><div className="max-w-md text-center">
    <Button variant="outline" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>AR / EN</Button>
    <h1 className="mt-6 text-2xl font-semibold">{notFound ? tr("Page not found", "الصفحة غير موجودة") : tr("This page could not load", "تعذّر تحميل الصفحة")}</h1>
    <p className="mt-3 text-muted-foreground">{notFound ? tr("This address is unavailable. Return to services.", "هذا العنوان غير متاح. عُد إلى الخدمات.") : tr("Please try again or return to services.", "يُرجى المحاولة مجدداً أو العودة إلى الخدمات.")}</p>
    <div className="mt-5 flex flex-wrap justify-center gap-3">{retry && <Button onClick={retry}>{tr("Try again", "حاول مجدداً")}</Button>}<Button asChild variant="outline"><Link to="/">{tr("Return to services", "العودة إلى الخدمات")}</Link></Button></div>
  </div></div>;
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return <I18nProvider><ServiceError retry={() => { router.invalidate(); reset(); }} /></I18nProvider>;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Each content route, / included, sets its own head(). Never add og:image or twitter:image here.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TRUST ZERO AI — Hackathon Prototype" },
      { name: "description", content: "Bilingual digital identity verification and impersonation detection prototype." },
      { name: "author", content: "TRUST ZERO AI" },
      { property: "og:title", content: "TRUST ZERO AI — Hackathon Prototype" },
      { property: "og:description", content: "Bilingual digital identity verification and impersonation detection prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    hydrateDemoStore();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </main>
          <SiteFooter />
        </div>
        <Toaster position="bottom-center" />
      </I18nProvider>
    </QueryClientProvider>
  );
}
