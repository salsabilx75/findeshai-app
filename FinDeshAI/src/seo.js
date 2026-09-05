/* ============================================================
   SEO SOURCE OF TRUTH — imported by BOTH src/App.jsx (runtime) and
   scripts/prerender.mjs (build time). Keeping it in one place is the
   whole point: before this existed, sitemap.xml was hand-maintained
   and drifted out of sync with ROUTES, and the HTML shipped to
   crawlers had a hardcoded canonical pointing every URL at "/" —
   which made Google fold all 9 sub-pages into the homepage and index
   only 1 page of the site (confirmed in Search Console, Sep 2026).

   Add a route here and it is automatically routed, prerendered with
   correct meta, and listed in sitemap.xml. Don't hand-edit
   public/sitemap.xml — it is generated on every build.

   Per-route fields:
     tab        which of the 4 main tabs is active (null = standalone page)
     view       standalone view key used by the router in App()
     title      <title> + og:title   — aim for under ~60 characters
     desc       meta description     — aim for 140–160 characters
     canonical  OPTIONAL. Set when this URL is an alias of another and
                should NOT be indexed separately (e.g. /tax-calculator).
     noindex    OPTIONAL. Excluded from sitemap + gets robots noindex.
     sitemap    OPTIONAL { priority, changefreq }. Defaults below.
     faq        OPTIONAL [{q,a}] emitted as FAQPage JSON-LD for rich results.
   ============================================================ */

export const SITE = "https://findeshai.com";
export const OG_IMAGE = SITE + "/og-image.png";
export const DEFAULT_DESC =
  "Free AI-powered investment advice, Sanchayapatra & FDR rates, DPS savings plans and loan EMI calculator for Bangladesh. Grow your money with FinDesh AI.";

export const ROUTES = {
  "/": {
    tab: "invest",
    title: "FinDesh AI — Bangladesh Personal Finance & Investment Tools",
    desc: DEFAULT_DESC,
    sitemap: { priority: "1.0", changefreq: "weekly" },
  },
  "/invest": {
    tab: "invest",
    title: "Where to Invest in Bangladesh 2026 — Free AI Planner",
    desc: "Get a personalised Bangladesh investment plan in seconds — Sanchayapatra, FDR, mutual funds, DSE blue-chips and gold, with verified 2026 rates and your risk level.",
    sitemap: { priority: "0.9", changefreq: "weekly" },
  },
  "/save": {
    tab: "save",
    title: "DPS Calculator Bangladesh 2026 — Monthly Savings Planner",
    desc: "Compare the best DPS rates in Bangladesh (up to ~11%) and see exactly what your monthly savings grow to at maturity. Free calculator, verified 2026 bank rates.",
    sitemap: { priority: "0.9", changefreq: "weekly" },
  },
  "/borrow": {
    tab: "borrow",
    title: "Loan EMI Calculator Bangladesh 2026 — Compare Bank Rates",
    desc: "Free loan EMI calculator for Bangladesh with a full repayment schedule, plus side-by-side personal, home and car loan rates from strong banks. Download as PDF.",
    sitemap: { priority: "0.9", changefreq: "weekly" },
  },
  "/blueprint": {
    tab: "blueprint",
    title: "Bangladesh Money Blueprint — Personal Finance Guide 2026",
    desc: "A conscious spending plan built for Bangladeshi salaries — how much to save, where to invest first, and how to automate it all with BD banks and instruments.",
    sitemap: { priority: "0.9", changefreq: "monthly" },
  },
  "/contact": {
    tab: null, view: "contact",
    title: "Get in Touch | FinDesh AI",
    desc: "Reach the team behind FinDesh AI — questions, feedback, partnerships or press, we'd love to hear from you.",
    sitemap: { priority: "0.5", changefreq: "yearly" },
  },
  "/sanchayapatra": {
    tab: "invest", view: "sanchayapatra",
    title: "Sanchayapatra Rate 2026 — Limits & Profit Calculator",
    desc: "Current Sanchayapatra rates (11.82–11.98%), individual vs joint investment limits, the combined-purchase rule, and a free profit calculator for Bangladesh.",
    sitemap: { priority: "0.9", changefreq: "weekly" },
    faq: [
      { q: "What is the Sanchayapatra rate in 2026?", a: "Following the January 2026 revision, Sanchayapatra rates range from about 11.82% to 11.98% depending on the scheme. The 5-year Bangladesh Sanchayapatra pays 11.83%, Paribar Sanchayapatra 11.93% and Pensioner Sanchayapatra 11.98% on investments up to ৳7.5 lakh, with slightly lower rates above that tier." },
      { q: "What is the maximum Sanchayapatra investment limit?", a: "The 5-year Bangladesh Sanchayapatra allows up to ৳30 lakh individually or ৳60 lakh jointly. Paribar Sanchayapatra is capped at ৳45 lakh and Pensioner Sanchayapatra at ৳50 lakh, both single-name only. Limits apply across all your purchases combined, not per certificate." },
      { q: "Is Sanchayapatra profit taxable in Bangladesh?", a: "Yes. Source tax of 5–10% is deducted from Sanchayapatra profit at payout, and the interest forms part of your total income. The investment itself still qualifies for the income tax investment rebate." },
    ],
  },
  "/income-tax": {
    tab: null, view: "income-tax",
    title: "Bangladesh Income Tax Calculator FY 2025-26 & 2026-27",
    desc: "Free Bangladesh income tax calculator for FY 2025-26 and FY 2026-27 — correct slabs, investment rebate, minimum tax and a downloadable computation sheet PDF.",
    sitemap: { priority: "0.9", changefreq: "monthly" },
    faq: [
      { q: "What is the tax-free income limit in Bangladesh?", a: "For FY 2025-26 the general tax-free limit is ৳3,75,000 — ৳4,25,000 for women and senior citizens aged 65 or above, ৳5,00,000 for persons with disability and third-gender taxpayers, and ৳5,25,000 for gazetted war-wounded freedom fighters. For FY 2026-27 the general limit rises to ৳4,00,000." },
      { q: "How is the Bangladesh income tax rebate calculated?", a: "The rebate is the lowest of three figures: a percentage of your eligible investment, 3% of your taxable income, and a statutory ceiling. For FY 2025-26 it is 15% of investment with a ৳10,00,000 ceiling; for FY 2026-27 the rate was cut to 10% with a ৳7,50,000 ceiling." },
      { q: "What is the minimum income tax in Bangladesh?", a: "If your income crosses the tax-free threshold, the minimum tax is ৳5,000 in Dhaka North, Dhaka South and Chattogram city corporations, ৳4,000 in other city corporations and ৳3,000 elsewhere — or ৳1,000 for a first-time filer whose taxable income is under ৳4,50,000." },
      { q: "When is the deadline to file an income tax return in Bangladesh?", a: "For individual taxpayers, Tax Day is 30 November. Filing between 1 July and 30 September earns a 5% rebate on your tax bill up to ৳25,000, while filing after the deadline adds a 2%–5% surcharge with a minimum penalty." },
    ],
  },
  "/tax-calculator": {
    tab: null, view: "income-tax",
    /* Alias kept because people search and link this phrasing. It must NOT be
       indexed separately — identical content to /income-tax — so it canonicals
       across and stays out of the sitemap. */
    canonical: "/income-tax",
    noindex: true,
    title: "Bangladesh Income Tax Calculator FY 2025-26 & 2026-27",
    desc: "Free Bangladesh income tax calculator for FY 2025-26 and FY 2026-27 — correct slabs, investment rebate, minimum tax and a downloadable computation sheet PDF.",
  },
  "/compare/credit-cards": {
    tab: null, view: "cmp-cards",
    title: "Compare Credit Cards Bangladesh 2026 — Fees & APR",
    desc: "Free side-by-side credit card comparison for Bangladesh — annual fees, interest rates and benefits across flagship cards from 10 banks. Compare up to 3 at once.",
    sitemap: { priority: "0.8", changefreq: "weekly" },
  },
  "/compare/savings": {
    tab: null, view: "cmp-savings",
    title: "Compare Savings Account Rates Bangladesh 2026",
    desc: "Compare regular savings-account interest rates across 10 Bangladeshi banks and see where your everyday money earns the most, with Islamic options flagged.",
    sitemap: { priority: "0.8", changefreq: "weekly" },
  },
  "/compare/loans": {
    tab: null, view: "cmp-loans",
    title: "Compare Loan Rates Bangladesh 2026 — Personal, Home & Car",
    desc: "Compare personal, home and car loan rates across 10 strong Bangladeshi banks side by side, with a built-in EMI calculator and downloadable repayment plan.",
    sitemap: { priority: "0.8", changefreq: "weekly" },
  },
};

/* Routes that belong in sitemap.xml: everything except aliases and noindex. */
export const indexableRoutes = () =>
  Object.entries(ROUTES)
    .filter(([, r]) => !r.noindex && !r.canonical)
    .map(([path, r]) => ({
      path,
      loc: SITE + (path === "/" ? "/" : path),
      priority: (r.sitemap && r.sitemap.priority) || "0.7",
      changefreq: (r.sitemap && r.sitemap.changefreq) || "monthly",
    }));

/* The URL Google should treat as authoritative for a given route. */
export const canonicalFor = (path) => {
  const r = ROUTES[path] || ROUTES["/"];
  const target = r.canonical || path;
  return SITE + (target === "/" ? "/" : target);
};
