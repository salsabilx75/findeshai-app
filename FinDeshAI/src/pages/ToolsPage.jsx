/* ============================================================
   /tools — one page listing every FinDesh tool with a one-line description.
   Lazy-loaded. Entries only render if their route exists, so this page can't
   ship a dead link. Linked from the footer ("All tools") and /learn.
   ============================================================ */
import { T, card, pill, h1, sub, gradText, useNav, taxTrack } from "../App.jsx";
import { ROUTES } from "../seo.js";
import { navTo } from "../hooks.js";

const has = path => !!ROUTES[String(path).split(/[?#]/)[0]];

const GROUPS = [
  { title: "Plan & calculate", items: [
    ["📈", "Invest planner", "/invest", "Pick an amount and a risk level; see where it could go, with listed rates."],
    ["💰", "Save · DPS planner", "/save", "See what a monthly saving grows to at each bank's listed DPS rate."],
    ["🏦", "Borrow · EMI calculator", "/borrow", "Your monthly EMI, total interest and repayment schedule, plus bank rates."],
    ["🏛️", "Sanchayapatra calculator", "/sanchayapatra", "Current rates, purchase limits and the profit on your amount."],
    ["🧾", "Income tax calculator", "/income-tax", "Tax for FY 2025-26 or 2026-27, with the investment rebate and a PDF."],
    ["📊", "Fund return calculator", "/compare/mutual-funds#mf-calculator", "What an amount became in each of 20 funds, next to deposit options."],
    ["🗺️", "Money Blueprint", "/blueprint", "A spending plan for Bangladeshi salaries, with an emergency fund calculator."],
  ] },
  { title: "Compare", items: [
    ["🏦", "Loan rates", "/compare/loans", "Personal, home and car loan rates across 10 banks."],
    ["💳", "Credit cards", "/compare/credit-cards", "Annual fees and interest on 8 cards; pick up to 3 side by side."],
    ["🏧", "Savings accounts", "/compare/savings", "Regular savings-account rates across 10 banks."],
    ["📊", "Mutual funds", "/compare/mutual-funds", "20 open-end funds by NAV, 2026 and 2025 returns, size and exit load."],
  ] },
  { title: "Learn", items: [
    ["📚", "Learn money basics", "/learn", "A plain-English guide from budgeting to tax, with a Bangla glossary."],
    ["📘", "FDR vs DPS vs Sanchayapatra", "/guides/fdr-vs-dps-vs-sanchayapatra", "Which one to use, and when."],
    ["📘", "Emergency fund in Dhaka", "/guides/emergency-fund-dhaka", "How much to keep and where to keep it."],
    ["📘", "How to compare two funds", "/guides/how-to-compare-mutual-funds", "A checklist using only published figures."],
    ["📘", "What NAV means", "/guides/what-is-nav", "And why sites show different numbers."],
    ["💼", "Find a better job", "/find-your-dream-job", "Market rate, CV and salary negotiation for Bangladesh."],
    ["❓", "FAQ", "/faq", "Answers to common money questions, grouped by topic."],
    ["🔍", "Methodology", "/methodology", "Where the numbers come from and how the maths works."],
  ] },
];

export default function ToolsPage() {
  const nav = useNav();
  return (
    <>
      <div style={{ textAlign: "center", padding: "40px 0 18px" }}>
        <div className="fd-up" style={pill}>🧰 All tools</div>
        <h1 className="fd-up fd-up-1" style={{ ...h1, fontSize: "clamp(28px,6vw,42px)" }}>Every FinDesh <span style={gradText}>tool</span></h1>
        <p className="fd-up fd-up-2" style={sub}>Free calculators, comparisons and guides for money in Bangladesh. No sign-up.</p>
      </div>
      {GROUPS.map(g => {
        const items = g.items.filter(([, , p]) => has(p));
        if (!items.length) return null;
        return (
          <section key={g.title} aria-label={g.title} style={{ marginBottom: 22 }}>
            <h2 style={{ margin: "6px 2px 12px", fontSize: 17, fontWeight: 900, color: "#fff" }}>{g.title}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10 }}>
              {items.map(([icon, name, path, line]) => (
                <a key={path} href={path} className="fd-item" onClick={e => { e.preventDefault(); taxTrack("tools_hub_click", { to: path }); navTo(nav, path); }}
                  style={{ ...card, padding: "14px 16px", borderRadius: 16, textDecoration: "none", display: "flex", gap: 12, alignItems: "flex-start", boxShadow: "none" }}>
                  <span aria-hidden style={{ fontSize: 20, lineHeight: 1.2 }}>{icon}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "#fff" }}>{name} <span style={{ color: T.accent }}>→</span></span>
                    <span style={{ display: "block", fontSize: 12.5, color: T.muted, lineHeight: 1.5, marginTop: 3 }}>{line}</span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
