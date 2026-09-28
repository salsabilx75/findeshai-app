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

/* Rendered on /find-your-dream-job AND emitted as FAQPage JSON-LD from the
   same array — single source so schema and visible copy can't diverge. */
export const CAREER_FAQ = [
  { q: "Is it rude to negotiate salary in Bangladesh?", a: "It feels that way because most of us were never shown how, not because employers are offended by it. In Bangladeshi companies pay is set at hiring and then moves mainly through annual increments, promotion or changing employer — so the offer conversation is one of the few moments your salary is genuinely flexible. Asking once, politely, with a market figure to back it up, is normal professional behaviour. The version that damages relationships is an ultimatum, not a question." },
  { q: "How do I find out what my job actually pays in Bangladesh?", a: "No single source is reliable here, so triangulate three. First, live bdjobs.com postings for your title — many list a salary range, and a week of watching gives you a band. Second, LinkedIn: filter by your role in Dhaka and read the postings from multinationals, which disclose more. Third, and most accurate, ask two or three people in the same role at other companies directly and privately. Glassdoor has thin Bangladesh coverage, so treat it as a hint rather than a number." },
  { q: "Everyone says jobs here come from referrals, not merit. Is that true?", a: "Referrals genuinely do carry a lot of hiring in Bangladesh — but the conclusion most people draw from that is the wrong one. It doesn't mean merit is irrelevant; it means the application queue is the weakest way in. The fix isn't to give up on merit, it's to stop relying only on the apply button: talk to people doing the job you want before a vacancy exists, so that when one opens you're already a name rather than a PDF." },
  { q: "My English isn't strong enough for a multinational role. Should I even try?", a: "Depends on the role more than you'd think. In most MNC roles in Dhaka the bar is being clear and understandable in a meeting, not sounding like a native speaker — finance, supply chain, operations and engineering roles are judged mainly on the work. Client-facing and regional roles do need more. If English is the gap, treat it as a specific skill with a plan rather than a permanent ceiling, and apply anyway in the meantime: you learn more from three real interviews than from a year of preparing for one." },
  { q: "Is remote work for foreign companies realistic from Bangladesh?", a: "Realistic, and already common — over 500,000 Bangladeshis work as freelancers for overseas clients, earning more than a billion dollars a year between them. Typical monthly earnings run roughly $300–$1,500 depending on skill and platform. What makes it hard isn't capability, it's the first client and getting paid: Payoneer is the usual route, since PayPal doesn't operate normally here. Treat it as a second income stream you build slowly, not a resignation plan." },
  { q: "How do I job search without my current employer finding out?", a: "Turn off LinkedIn's 'share profile changes' before you touch your profile, and use the private 'Open to work — recruiters only' setting rather than the public green banner. Don't list colleagues as references without asking first. Interview using annual leave rather than sick days. And be careful who you tell at work — in Dhaka's smaller industries, word moves between companies faster than you expect." },
  { q: "I'm underpaid but I like my team. Should I still leave?", a: "Not necessarily — but find out what you're worth before deciding, because 'I like my team' shouldn't be a reason you never checked. Once you know the market rate, you have a real choice: ask for a correction internally with evidence, or accept the gap knowingly as the price of a job you enjoy. Both are legitimate. Not knowing isn't a decision, it's a default." },
  { q: "Do multinationals, local conglomerates and startups negotiate differently?", a: "Very. Multinationals usually have banded pay structures — there's a defined range for the grade, real room inside it, and almost none outside it, so negotiate within the band and push on grade. Local conglomerates are more personal and more variable; the hiring manager often has genuine discretion, and the relationship matters as much as the figure. Startups have the least cash and the most flexibility on everything else — title, scope, hours, learning budget. Ask what's flexible before naming a number." },
  { q: "What should a Bangladeshi CV look like in 2026?", a: "Two pages maximum, no photo unless the employer asks, and no marital status, religion or national ID — those are still common on BD templates and they date you instantly to anyone hiring at an MNC. Lead with what you achieved, not what you were responsible for: 'cut monthly reporting time from five days to two' beats 'responsible for monthly reporting'. Numbers are the whole game. Tailor the top third to each role; nobody reads past it on the first pass." },
  { q: "How much should I ask for when they ask my expected salary?", a: "Give a range whose bottom is a number you'd genuinely accept, because you'll usually be offered the bottom. Anchor it to your researched market rate and to the new role's responsibilities, not to your current salary plus a bit — that arithmetic is how underpaid people stay underpaid for a decade. If they ask your current salary first, it's fair to answer with what you're looking for instead." },
  { q: "Is a degree still what gets you hired here?", a: "Less than the education system implies. Bangladesh produces 700,000–800,000 graduates a year, and the tertiary-educated youth unemployment rate was 13.5% in the 2024 Labour Force Survey — with around 885,000 graduates unemployed. Roughly 12,000 computer science graduates enter a market generating about 5,000 entry-level tech jobs annually. The degree gets your CV read; demonstrable skill and someone willing to vouch for you get you hired." },
  { q: "Will the new government pay scale change private sector salaries?", a: "Possibly, over time. The National Pay Scale 2026 raises government basic pay by roughly 100% to 142% across grades, effective 1 July 2026 and phased through to July 2027. When public sector pay moves that much, private employers competing for the same people usually feel pressure to follow — though not immediately and not evenly. It's a reasonable thing to raise at your next review if you're clearly below market." },
  { q: "I've been applying for months with no replies. What am I doing wrong?", a: "Almost always one of three things. Your CV is a duty list rather than an achievement list, so nothing stands out in a six-second scan. You're applying only through job boards, which is the most crowded channel. Or you're applying to roles you're a 60% match for, where the queue is long and hundreds are a 90% match. Fix the CV first — it's the cheapest change and it affects every application after it." },
  { q: "Should I take a pay cut for a better company or role?", a: "Sometimes yes, but set conditions before you do. Be specific about what you're buying — a skill, a brand on your CV, a path to a role that doesn't exist where you are — and set a time limit on when the pay has to catch up. And do the arithmetic on what the cut costs you over the full period, not per month; run it through the Save planner so you're choosing with a real number in front of you rather than a hopeful feeling." },
  { q: "Does earning more actually make me richer?", a: "Only if the extra money has somewhere to go before it reaches your daily spending. A raise that arrives with no plan gets absorbed within about two months — the honest failure mode of every salary increase. The move is to decide where the increase goes on the day it lands: a DPS, Sanchayapatra, or simply a higher automatic transfer. Earning more is the fastest lever in personal finance and the easiest one to waste." },
];

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
  /* The "earn more" pillar, alongside /invest /save /borrow. Slug is a
     sentence rather than the site's usual short noun — founder's call, kept
     because it matches how people phrase the search. FAQ lives in
     CAREER_FAQ below and is rendered on-page from the same array, so the
     FAQPage JSON-LD can never drift from the visible text (Google penalises
     schema that doesn't match what the user sees). */
  "/find-your-dream-job": {
    tab: null, view: "dream-job",
    title: "Find a Better Job in Bangladesh — Salary Playbook 2026",
    desc: "A practical playbook for earning more in Bangladesh: find your market rate, fix a BD-style CV, negotiate without burning bridges, and weigh remote work for foreign clients.",
    sitemap: { priority: "0.9", changefreq: "monthly" },
    get faq() { return CAREER_FAQ; },
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
  "/compare/mutual-funds": {
    tab: null, view: "cmp-mutualfunds",
    title: "Compare Mutual Funds Bangladesh 2026 — NAV & Returns",
    desc: "Compare 20 of Bangladesh's largest open-end mutual funds by NAV, 2026 year-to-date and 2025 returns, dividend and Shariah status. Historical, not guaranteed.",
    sitemap: { priority: "0.8", changefreq: "monthly" },
    faq: [
      { q: "What is a mutual fund in Bangladesh?", a: "A mutual fund pools money from many investors and a professional asset manager invests it across shares, bonds and deposits. You own units, and the unit price (NAV) rises or falls with the value of what the fund holds. Unlike Sanchayapatra, DPS or FDR, a mutual fund has no promised rate — returns can be negative." },
      { q: "Are mutual fund returns guaranteed in Bangladesh?", a: "No. Every return figure is historical and can be negative. Of the 20 largest open-end funds, five lost money during 2025 while most gained during 2026. If you need a fixed, guaranteed return, Sanchayapatra, a bank DPS or an FDR are the right instruments instead." },
      { q: "What is the difference between open-end and closed-end mutual funds?", a: "Open-end funds are bought and sold directly with the asset management company at NAV-linked prices, and the fund can issue new units at any time. Closed-end funds have a fixed number of units that trade on the Dhaka Stock Exchange like a share, so their market price can differ from NAV. The funds compared here are all open-end." },
      { q: "Which Bangladeshi mutual funds are Shariah-compliant?", a: "Several funds are registered as Shariah funds, including the IDLC AML Shariah Fund and the Shanta Amanah Shariah Fund. They avoid interest-bearing instruments and non-compliant sectors. Use the Shariah-only filter on this page to see them, and confirm the certification with the asset manager before investing." },
    ],
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
