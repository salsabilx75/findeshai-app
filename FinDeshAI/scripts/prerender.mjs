/* ============================================================
   BUILD-TIME PRERENDER + SITEMAP GENERATOR
   Runs after `vite build` (see package.json → "build").

   WHY THIS EXISTS
   FinDesh is a client-rendered SPA behind a Netlify catch-all rewrite, so
   every URL used to return the same index.html — with a hardcoded
   <link rel="canonical" href="https://findeshai.com/">. Crawlers act on the
   HTML they are served, before any JavaScript runs, so Google was told that
   /income-tax, /sanchayapatra and every compare page were duplicates of the
   homepage. Search Console (Sep 2026) confirmed the damage: 9 URLs submitted,
   exactly 1 page indexed. Facebook/WhatsApp scrapers never run JS at all, so
   every shared link also previewed as the generic homepage.

   WHAT IT DOES
   For each indexable route it writes dist/<route>/index.html — a real file
   with that route's title, description, canonical, OG/Twitter tags and
   JSON-LD baked in. Netlify serves a matching static file before falling
   through to the SPA rewrite, so crawlers get correct HTML and users still
   get the same single-page app (React boots and takes over as before).

   It also regenerates public/sitemap.xml from the same route table, so the
   sitemap can no longer drift out of sync with the app.

   This is meta-level prerendering, not full SSR: the <body> is still the
   empty #root that React fills. Google renders JS and will see the content;
   the fatal problem was never the body, it was being told every page was a
   duplicate of the homepage.
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ROUTES, SITE, OG_IMAGE, indexableRoutes, canonicalFor } from "../src/seo.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Replace an existing tag's attribute value in the built HTML. Anchored on the
   identifying attribute so we never touch a different tag by accident. */
function setMeta(html, selectorAttr, selectorValue, targetAttr, newValue) {
  const needle = selectorValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  /* Capture the opening quote char and close on the SAME one via a
     backreference. A naive [^"']* value class truncates at the first
     apostrophe, which silently mangled og:title on every page
     ("...Bangladesh" + leftover "'s First AI Personal Finance..."). */
  const re = new RegExp(
    `(<(?:meta|link)[^>]*${selectorAttr}=["']${needle}["'][^>]*?${targetAttr}=)(["'])([\\s\\S]*?)\\2`,
    "i"
  );
  if (!re.test(html)) {
    console.warn(`  ! tag not found: ${selectorAttr}="${selectorValue}" — skipped`);
    return html;
  }
  return html.replace(re, `$1$2${newValue}$2`);
}

function buildJsonLd(path, route) {
  const url = SITE + (path === "/" ? "/" : path);
  const blocks = [];

  blocks.push({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: route.title,
    description: route.desc,
    url,
    isPartOf: { "@type": "WebSite", name: "FinDesh AI", url: SITE },
    inLanguage: "en-BD",
    publisher: { "@type": "Organization", name: "FinDesh AI", url: SITE, logo: OG_IMAGE },
  });

  if (route.faq && route.faq.length) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: route.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  if (path !== "/") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "FinDesh AI", item: SITE },
        { "@type": "ListItem", position: 2, name: route.title.split("—")[0].split("|")[0].trim(), item: url },
      ],
    });
  }

  return blocks
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join("\n    ");
}

function renderRoute(templateHtml, path, route) {
  const url = SITE + (path === "/" ? "/" : path);
  let html = templateHtml;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(route.title)}</title>`);
  html = setMeta(html, "name", "description", "content", esc(route.desc));
  html = setMeta(html, "rel", "canonical", "href", canonicalFor(path));
  html = setMeta(html, "property", "og:url", "content", url);
  html = setMeta(html, "property", "og:title", "content", esc(route.title));
  html = setMeta(html, "property", "og:description", "content", esc(route.desc));
  html = setMeta(html, "name", "twitter:title", "content", esc(route.title));
  html = setMeta(html, "name", "twitter:description", "content", esc(route.desc));
  html = setMeta(html, "name", "robots", "content", route.noindex ? "noindex, follow" : "index, follow");

  /* Swap the template's static JSON-LD for this route's own blocks. */
  html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<\/head>/i, `  ${buildJsonLd(path, route)}\n  </head>`);

  return html;
}

function writeSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = indexableRoutes()
    .map(
      (r) =>
        `  <url><loc>${r.loc}</loc><lastmod>${today}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  writeFileSync(join(ROOT, "public", "sitemap.xml"), xml, "utf8");
  if (existsSync(DIST)) writeFileSync(join(DIST, "sitemap.xml"), xml, "utf8");
  return indexableRoutes().length;
}

function main() {
  const indexPath = join(DIST, "index.html");
  if (!existsSync(indexPath)) {
    console.error("prerender: dist/index.html not found — run `vite build` first.");
    process.exit(1);
  }
  const template = readFileSync(indexPath, "utf8");

  let count = 0;
  for (const [path, route] of Object.entries(ROUTES)) {
    const html = renderRoute(template, path, route);
    if (path === "/") {
      writeFileSync(indexPath, html, "utf8");
    } else {
      const dir = join(DIST, path.replace(/^\//, ""));
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "index.html"), html, "utf8");
    }
    count++;
    console.log(`  ✓ ${path.padEnd(24)} → ${route.noindex ? "noindex" : "index"}`);
  }

  const sitemapCount = writeSitemap();
  console.log(`\nprerender: ${count} routes written, sitemap regenerated with ${sitemapCount} URLs.`);
}

main();
