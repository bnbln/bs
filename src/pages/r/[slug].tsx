import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

/**
 * Per-slug redirect targets.
 * Default: "/" (homepage)
 * Add entries to route specific slugs to different pages, e.g.:
 *   "zalando": "/work",
 *   "agentur-x": "/project/e-rechnung-ux-case-study",
 */
const TARGETS: Record<string, string> = {
  // "zalando": "/",
  // "stroeer": "/work",
};

const DEFAULT_TARGET = '/';

export default function RefRedirect() {
  const router = useRouter();
  const slug = router.query.slug as string | undefined;

  useEffect(() => {
    if (!router.isReady) return;
    const target = (slug && TARGETS[slug]) || DEFAULT_TARGET;
    router.replace(target);
  }, [router.isReady, slug, router]);

  return (
    <Head>
      <meta name="robots" content="noindex, nofollow" />
    </Head>
  );
}
