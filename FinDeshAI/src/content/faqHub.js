/* ============================================================
   /faq HUB — every question FinDesh answers, grouped by topic.

   Almost all answers are REUSED from the per-page FAQ arrays (same objects,
   same text), so the hub can never contradict the page a question came from.
   Only the "About FinDesh" group is new. Where a reused answer pointed at
   something "above" or "on this page", the hub swaps in the page name via
   `adapt()` — the original arrays are untouched.

   This module is loaded lazily (by the /faq page chunk, and by prerender for
   the FAQPage JSON-LD). It must stay plain JS — no JSX, no App.jsx import —
   because the prerender script runs it in Node.
   ============================================================ */
import { LEARN_FAQ, LOANS_FAQ, SAVINGS_CMP_FAQ, CARDS_FAQ, MF_FAQ } from "./faqs.js";
import { TAX_FAQ } from "./taxFaq.js";
import { ROUTES } from "../seo.js";

export const FAQ_HUB_UPDATED = "8 October 2026";

/* Same address as CONTACT_EMAIL in App.jsx (kept literal: this file runs in Node). */
const EMAIL = "findeshai@gmail.com";

const ABOUT_FAQ = [
  { q: "What is FinDesh AI?", a: "A free website that explains Bangladeshi money products in plain English and lets you compare and calculate them — Sanchayapatra, DPS, FDR, mutual funds, loans, credit cards and income tax. Figures are in taka and come from Bangladeshi institutions." },
  { q: "Is FinDesh free to use?", a: "Yes. Every calculator, comparison and guide on the site is free and needs no sign-up. FinDesh also sells two optional paid guides (The Bangladesh Money Playbook and the First Job Money Guide). You never need to buy them to use the tools." },
  { q: "Where do FinDesh's figures come from?", a: "From the bodies that set or publish them: the Department of National Savings for Sanchayapatra, each bank's own published rate sheets for DPS, FDR, loans, savings accounts and cards, LankaBangla's weekly open-end mutual fund review for fund data, and the Finance Act 2026 for income tax. Each figure shows the date it was checked, and the Methodology page lists every source." },
  { q: "Does FinDesh store what I type into the calculators?", a: "FinDesh has no user accounts and no database of your inputs — the calculations run in your browser. Like most websites it uses analytics tools (Google Analytics, Microsoft Clarity and the Meta Pixel) to understand how pages are used. If you press an 'Ask AI' button, the numbers from that calculation are sent to Google's Gemini service so it can write the explanation." },
  { q: "I spotted a wrong number. How do I report it?", a: `Email ${EMAIL} with the page and the figure, ideally with a link to the official source. Every comparison table also has a 'Report a data issue' link that opens a pre-filled email.` },
];

/* Hub-only wording fixes for answers written to sit on their own page. Each
   replacement is asserted, so a later edit to the source text fails loudly in
   the build instead of silently shipping "the calculator above" on /faq. */
function adapt(item, from, to) {
  if (!item.a.includes(from)) throw new Error(`faqHub: expected "${from}" in "${item.q}"`);
  return { q: item.q, a: item.a.replace(from, to) };
}

const SP_FAQ = ROUTES["/sanchayapatra"].faq;

/* link = the page that answers this best; shown under the answer. */
const L = (item, link) => ({ ...item, link });

export const FAQ_CATEGORIES = [
  {
    id: "about", title: "About FinDesh",
    items: [
      L(ABOUT_FAQ[0], "/learn"),
      L(ABOUT_FAQ[1], "/tools"),
      L(LEARN_FAQ[9], "/methodology"),
      L(LEARN_FAQ[8], "/methodology"),
      L(ABOUT_FAQ[2], "/methodology"),
      L(ABOUT_FAQ[3], "/about"),
      L(ABOUT_FAQ[4], "/contact"),
    ],
  },
  {
    id: "basics", title: "Money basics",
    items: [
      L(LEARN_FAQ[0], "/learn#order"),
      L(LEARN_FAQ[3], "/learn#budgeting"),
      L(LEARN_FAQ[5], "/learn#credit-cards"),
      L(LEARN_FAQ[2], "/learn#inflation"),
      L(LEARN_FAQ[6], "/learn#compounding"),
    ],
  },
  {
    id: "saving", title: "Saving: Sanchayapatra, DPS, FDR",
    items: [
      L(SP_FAQ[0], "/sanchayapatra"),
      L(SP_FAQ[1], "/sanchayapatra"),
      L(SP_FAQ[2], "/sanchayapatra"),
      L(LEARN_FAQ[1], "/compare/savings"),
      L(SAVINGS_CMP_FAQ[0], "/compare/savings"),
      L(SAVINGS_CMP_FAQ[2], "/compare/savings"),
      L(LEARN_FAQ[7], "/learn#glossary"),
    ],
  },
  {
    id: "funds", title: "Mutual funds",
    items: [
      L(adapt(MF_FAQ[0], "Every figure on this page is historical.", "Every fund figure on FinDesh is historical."), "/compare/mutual-funds"),
      L(MF_FAQ[1], "/learn#mutual-funds"),
      L(MF_FAQ[2], "/compare/mutual-funds"),
      L(MF_FAQ[3], "/compare/mutual-funds#mf-calculator"),
      L(adapt(MF_FAQ[4], "Use the Shariah-only filter above", "Use the Shariah-only filter on the mutual fund comparison"), "/compare/mutual-funds"),
    ],
  },
  {
    id: "borrowing", title: "Loans & credit cards",
    items: [
      L(LOANS_FAQ[0], "/compare/loans"),
      L(LOANS_FAQ[1], "/compare/loans"),
      L(adapt(LOANS_FAQ[2], "Use the calculator above", "Use the EMI calculator on the Borrow page"), "/borrow"),
      L(LOANS_FAQ[3], "/compare/loans"),
      L(CARDS_FAQ[0], "/compare/credit-cards"),
      L(CARDS_FAQ[1], "/compare/credit-cards"),
      L(CARDS_FAQ[2], "/compare/credit-cards"),
      L(CARDS_FAQ[3], "/compare/credit-cards"),
    ],
  },
  {
    id: "tax", title: "Income tax",
    items: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10].map(i => L(TAX_FAQ[i], "/income-tax")),
  },
];

/* "Start with these" — the six most-asked, by reference into the groups above. */
export const FAQ_START = [
  ["basics", 0], ["about", 2], ["saving", 0], ["funds", 0], ["tax", 1], ["borrowing", 0],
].map(([c, i]) => FAQ_CATEGORIES.find(x => x.id === c).items[i]);

/* Flat list for FAQPage JSON-LD — exactly the visible questions, each once. */
export const FAQ_HUB_FLAT = FAQ_CATEGORIES.flatMap(c => c.items.map(({ q, a }) => ({ q, a })));
