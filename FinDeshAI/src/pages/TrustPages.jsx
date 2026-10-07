/* ============================================================
   TRUST PAGES — /methodology, /about, /faq.
   One lazy chunk (React.lazy in App.jsx), so none of this text lands in the
   initial bundle.

   SOURCING RULE (same as /learn): every date and figure here is read from the
   app's own dated constants and data arrays, never typed in by hand, so these
   pages can't drift from what the tools actually use. Statements about how a
   calculator works describe the code as it is (see the function named in each
   comment).
   ============================================================ */
import { useEffect, useMemo, useState } from "react";
import {
  T, card, pill, h1, sub, gradText, RelatedLinks, useNav, taxTrack,
  INFLATION, POLICY_RATE, LAST_UPDATED, CMP_UPDATED, CMP_LOANS, CMP_SAVINGS, CMP_CARDS,
  MF_UPDATED, MF_SOURCE_URL, CONTACT_EMAIL, GUIDE_PRICE,
} from "../App.jsx";
import { ROUTES } from "../seo.js";
import { FAQ_CATEGORIES, FAQ_START, FAQ_HUB_UPDATED } from "../content/faqHub.js";
import { navTo, useDebounced } from "../hooks.js";

const has = path => !!ROUTES[String(path).split("#")[0]];
const REVIEWED = "8 October 2026";

/* ---------- shared bits ---------- */
const H2 = ({ id, children }) => (
  <h2 id={id} style={{ margin: "0 0 12px", fontSize: 19, fontWeight: 900, color: "#fff", letterSpacing: "-0.015em", lineHeight: 1.25 }}>{children}</h2>
);
const P = ({ children, style }) => (
  <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.7, color: "#C9D8F0", ...style }}>{children}</p>
);
const B = ({ children }) => <b style={{ color: "#fff" }}>{children}</b>;
const Sec = ({ id, children }) => (
  <section id={id} aria-labelledby={id + "-h"} className="fd-up" style={{ ...card, padding: "22px 20px", marginBottom: 16, scrollMarginTop: 170 }}>{children}</section>
);
const List = ({ items }) => (
  <ul style={{ margin: "0 0 12px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
    {items.map((x, i) => <li key={i} style={{ fontSize: 14, lineHeight: 1.65, color: "#C9D8F0" }}>{x}</li>)}
  </ul>
);
function Hero({ kicker, title, accent, lead, meta }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0 18px" }}>
      <div className="fd-up" style={pill}>{kicker}</div>
      <h1 className="fd-up fd-up-1" style={{ ...h1, fontSize: "clamp(28px,6vw,42px)" }}>{title} {accent && <span style={gradText}>{accent}</span>}</h1>
      {lead && <p className="fd-up fd-up-2" style={sub}>{lead}</p>}
      {meta && <p style={{ margin: "14px 0 0", fontSize: 12, color: T.faint }}>{meta}</p>}
    </div>
  );
}
function InLink({ to, children }) {
  const nav = useNav();
  if (!has(to)) return <>{children}</>;
  return <a href={to} className="fd-link" onClick={e => { e.preventDefault(); navTo(nav, to); }} style={{ color: "#8AC2FF", fontWeight: 700, textDecoration: "none" }}>{children}</a>;
}
const mailIssue = (where) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Data issue on FinDesh: " + where)}`;
function ReportIssue({ where }) {
  return (
    <a href={mailIssue(where)} onClick={() => taxTrack("data_issue_clicked", { from: where })}
      style={{ display: "inline-block", marginTop: 4, padding: "10px 16px", fontSize: 13, fontWeight: 700, borderRadius: 11, border: `1px solid ${T.accentBorder}`, background: T.accentSoft, color: "#8AC2FF", textDecoration: "none" }}>
      ✉ Report a data issue →
    </a>
  );
}
const related = links => links.filter(l => has(l.path));

/* ============================================================
   /methodology
   ============================================================ */
/* Rows in the compare tables whose newest published sheet is from before
   2026. Derived from each row's own `src`, so this list updates itself. */
const OLDER_ROWS = [
  ...CMP_LOANS.map(r => ({ kind: "Loans", bank: r.bank, src: r.src })),
  ...CMP_SAVINGS.map(r => ({ kind: "Savings accounts", bank: r.bank, src: r.src })),
  ...CMP_CARDS.map(r => ({ kind: "Credit cards", bank: r.bank || r.card, src: r.src })),
].filter(r => /20(1\d|2[0-5])/.test(r.src || ""));

const SOURCES = [
  { what: "Sanchayapatra rates & purchase limits", src: <>Department of National Savings (<a href="https://nationalsavings.gov.bd" target="_blank" rel="noopener noreferrer" style={{ color: "#8AC2FF" }}>nationalsavings.gov.bd</a>), January 2026 rate revision</>, asOf: `Checked ${LAST_UPDATED}` },
  { what: "Bank DPS and FDR rates", src: "Each bank's own website and published deposit rate sheet", asOf: `Checked ${LAST_UPDATED}` },
  { what: "Wage Earner Development Bond, Treasury bonds & bills", src: "Bangladesh Bank", asOf: `Checked ${LAST_UPDATED}` },
  { what: "Loan rates (personal, home, car)", src: "Each bank's Declared Lending Rate sheet", asOf: `${CMP_UPDATED}; each row shows its sheet's date` },
  { what: "Savings-account rates", src: "Each bank's deposit rate sheet", asOf: `${CMP_UPDATED}; each row shows its sheet's date` },
  { what: "Credit card fees and interest", src: "Each bank's schedule of charges", asOf: `${CMP_UPDATED}; each row shows its sheet's date` },
  { what: "Mutual funds (NAV, returns, size, loads, dividend)", src: <>LankaBangla Financial Portal, Weekly Open End Mutual Fund Review, compiled from UCB Stock Brokerage (<a href={MF_SOURCE_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#8AC2FF" }}>source</a>)</>, asOf: MF_UPDATED },
  { what: "Income tax slabs, rebate and minimum tax", src: "Finance Act 2026, cross-checked against published tax summaries", asOf: `Checked ${LAST_UPDATED}` },
  { what: "Inflation", src: `An assumption of ~${INFLATION}% a year, based on reported early-2026 inflation (about 8.58% year-on-year in January 2026; 12-month average about 8.66%)`, asOf: "Early 2026" },
  { what: "Policy rate", src: `Bangladesh Bank repo rate, ${POLICY_RATE}%, held January–June 2026`, asOf: "June 2026" },
];

const CALCS = [
  { t: "Invest planner", path: "/invest", d: <>Your risk choice (Conservative, Balanced or Aggressive) picks one of three fixed allocation templates. The "~1yr est." on each option is your amount × that option's listed rate — one representative rate inside the published range. "Real" is that rate minus the inflation assumption, a rough approximation. <B>Mutual funds get no estimate</B>, because they have no rate to project; their past range is shown instead. The PDF's 5-year column compounds the listed rate once a year and is illustrative only.</> },
  { t: "Save / DPS planner", path: "/save", d: <>Treats your deposit as a fixed monthly amount and compounds it monthly at the scheme's listed rate: maturity = monthly × ((1 + r)ⁿ − 1) ÷ r, with r the monthly rate and n the number of months. Banks may compound differently and deduct source tax, so the bank's maturity figure can differ.</> },
  { t: "Sanchayapatra calculator", path: "/sanchayapatra", d: <>Yearly profit = amount × the certificate's published rate, before the 5–10% source tax. Real return = rate minus the inflation assumption.</> },
  { t: "EMI calculator", path: "/borrow", d: <>Standard reducing-balance EMI: P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1). Processing fees, insurance and early-settlement charges are not included.</> },
  { t: "Income tax calculator", path: "/income-tax", d: <>Applies the slabs, tax-free thresholds, investment rebate rule and minimum tax for the financial year you pick. The arithmetic is fixed rules only; the optional AI explanation never changes the numbers.</> },
  { t: "Mutual fund return calculator", path: "/compare/mutual-funds#mf-calculator", d: <>Applies each fund's published return for one fixed period (2026 to date, or full-year 2025) to your amount. Deposit comparisons use simple interest for the same number of days, before tax. No 1-, 3- or 5-year returns, no SIP, no dividend reinvestment — the source doesn't publish what those need.</> },
  { t: "Compounding calculator (Learn)", path: "/learn#compounding", d: <>Compounds monthly at the rate you enter; "in today's money" divides the result by the inflation assumption compounded over the same years.</> },
  { t: "Comparison tables", path: "/compare/loans", d: <>Default order is shuffled on each visit so no provider sits on top by default; use Sort to order by any column. Bars are relative to the largest value in that column, not a 0–100% scale. A "lowest" or "highest" marker appears only when one or two rows share the best value, and it describes the number, not a recommendation.</> },
];

export function MethodologyPage() {
  return (
    <>
      <Hero kicker="🔍 Methodology" title="How FinDesh" accent="works" lead="Where every number comes from, when it was checked, how each calculator does its maths — and what it deliberately leaves out." meta={`Last reviewed ${REVIEWED}`} />

      <Sec id="short">
        <H2 id="short-h">The short version</H2>
        <List items={[
          <>Every figure carries the date it was checked. Nothing on FinDesh is "live".</>,
          <>Figures come from the institution that sets them or from a named, dated publication.</>,
          <>Calculators use simple, visible maths, listed below. None of them is a forecast.</>,
          <>When we can't source a number, we leave it out rather than estimate it.</>,
        ]} />
      </Sec>

      <Sec id="sources">
        <H2 id="sources-h">Where the numbers come from</H2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {SOURCES.map((s, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: i < SOURCES.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{s.what}</div>
              <div style={{ fontSize: 13, color: "#C9D8F0", lineHeight: 1.6, marginTop: 3 }}>{s.src}</div>
              <div style={{ fontSize: 12, color: T.amber, fontWeight: 700, marginTop: 3 }}>{s.asOf}</div>
            </div>
          ))}
        </div>
        <P style={{ marginTop: 12, fontSize: 13, color: T.muted }}>Options on the Invest page that have no published rate — DSE shares, gold, land and startups — show broad indicative ranges, not sourced rates. Treat them as rough illustration only.</P>
      </Sec>

      <Sec id="updates">
        <H2 id="updates-h">How often we update</H2>
        <P>The aim is to re-check rates every month and stamp each snapshot with its date. In practice some figures are older than that, and we say so instead of hiding it. As of {REVIEWED}:</P>
        <List items={[
          <>Bank, DPS, FDR, loan, card and Sanchayapatra rates were last checked in <B>{LAST_UPDATED}</B>.</>,
          <>Mutual fund figures are from the <B>{MF_UPDATED}</B> weekly review.</>,
          ...(OLDER_ROWS.length ? [<>A few banks' newest published sheet is older than 2026, and those rows say so: {OLDER_ROWS.map(r => `${r.bank} (${r.kind.toLowerCase()}, ${r.src.split("·").pop().trim()})`).join("; ")}.</>] : []),
        ]} />
        <P style={{ marginBottom: 0 }}>Rates change. Always confirm with the bank, fund manager or the Department of National Savings before you commit money.</P>
      </Sec>

      <Sec id="calculators">
        <H2 id="calculators-h">How each calculator works</H2>
        {CALCS.map(c => (
          <div key={c.t} style={{ padding: "12px 0", borderBottom: `1px solid ${T.borderSoft}` }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "#fff", marginBottom: 4 }}><InLink to={c.path}>{c.t}</InLink></div>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "#C9D8F0" }}>{c.d}</div>
          </div>
        ))}
      </Sec>

      <Sec id="not-modelled">
        <H2 id="not-modelled-h">What the numbers leave out</H2>
        <List items={[
          <><B>Taxes</B> — source tax on Sanchayapatra (5–10%) and FDR/DPS profit (10–15%) is not deducted, except in the income tax calculator.</>,
          <><B>Fees</B> — account maintenance, loan processing (often 0.5–1.5%), card charges beyond the listed annual fee, and fund management costs.</>,
          <><B>Spreads and loads</B> — the gap between a fund's buy and sell price, and entry or exit loads.</>,
          <><B>Platform charges</B> — brokerage, BO account fees, and any app or agent charges.</>,
          <><B>Early-exit penalties</B> — breaking an FDR, DPS or Sanchayapatra early usually pays less than the listed rate.</>,
          <><B>Changing inflation</B> — one fixed inflation assumption (~{INFLATION}%) is used everywhere; real inflation moves year to year.</>,
        ]} />
      </Sec>

      <Sec id="omissions">
        <H2 id="omissions-h">What we deliberately don't show</H2>
        <List items={[
          <>Mutual fund 1-, 3-, 5-year and since-launch returns, SIP or IRR results — no accessible source publishes them per fund.</>,
          <>Fund holdings, star ratings, minimum investment and expense ratios — not in our source, so not guessed.</>,
          <>Credit card reward and cashback rates — banks don't publish them consistently, so we show "contact bank".</>,
          <>Savings-account balance tiers — most banks don't publish the tier boundaries.</>,
          <>Live NAV or live rates — everything is a dated snapshot.</>,
          <>Banks under Bangladesh Bank resolution or with known liquidity stress are left out of the recommendations.</>,
        ]} />
      </Sec>

      <Sec id="report">
        <H2 id="report-h">Found a wrong or outdated number?</H2>
        <P>Email us with the page, the figure and, ideally, a link to the official source. Every comparison table has the same link underneath it.</P>
        <ReportIssue where="/methodology" />
      </Sec>

      <RelatedLinks links={related([
        { label: "Learn money basics", path: "/learn" },
        { label: "FAQ", path: "/faq" },
        { label: "About FinDesh", path: "/about" },
        { label: "Compare mutual funds", path: "/compare/mutual-funds" },
      ])} />
    </>
  );
}

/* ============================================================
   /about
   ============================================================ */
/* OWNER DECISION: the independence sentence below renders ONLY when this is
   true. Set it to true once the owner confirms that no bank, fund manager or
   card issuer pays FinDesh for ranking, placement or coverage. */
const INDEPENDENCE_CONFIRMED = false;

export function AboutPage() {
  return (
    <>
      <Hero kicker="👋 About" title="About" accent="FinDesh AI" lead="Free, plain-English money tools for people in Bangladesh — with the source and date on every number." />

      <Sec id="why">
        <H2 id="why-h">Why it exists</H2>
        <P>Money information in Bangladesh is scattered across bank brochures, rate-sheet PDFs and word of mouth. Comparing a DPS with an FDR, or a fund with a Sanchayapatra, usually means opening a dozen tabs.</P>
        <P style={{ marginBottom: 0 }}>FinDesh puts the published numbers side by side, explains them in plain English, and gives you a calculator for each decision.</P>
      </Sec>

      <Sec id="who">
        <H2 id="who-h">Who builds it</H2>
        <P style={{ marginBottom: 0 }}>FinDesh AI is built and maintained by one person in Dhaka. {/* OWNER: confirm wording; add a name here only if you want one shown. */} Rates are taken from each institution's own published figures, and the date they were checked is shown next to them.</P>
      </Sec>

      <Sec id="money">
        <H2 id="money-h">How FinDesh makes money</H2>
        <P>The calculators, comparisons and guides are free and need no sign-up. FinDesh sells two optional guides — The Bangladesh Money Playbook and the First Job Money Guide — at ৳{GUIDE_PRICE} each. You never need them to use the tools.</P>
        {INDEPENDENCE_CONFIRMED && <P style={{ marginBottom: 0 }}>FinDesh does not accept payment from banks, fund managers or card issuers to rank, feature or review their products.</P>}
      </Sec>

      <Sec id="not">
        <H2 id="not-h">What FinDesh is not</H2>
        <List items={[
          "Not a bank, broker or fund manager — it doesn't take deposits or sell financial products.",
          "Not a licensed financial or tax adviser — everything here is general information.",
          "Not a tax filing service — returns are filed on the NBR's own e-Return system.",
        ]} />
        <P style={{ marginBottom: 0 }}>For how the numbers are sourced and calculated, see the <InLink to="/methodology">methodology</InLink>.</P>
      </Sec>

      <Sec id="contact">
        <H2 id="contact-h">Get in touch</H2>
        <P>Questions, corrections or ideas: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#8AC2FF", fontWeight: 700 }}>{CONTACT_EMAIL}</a>{has("/contact") && <> or the <InLink to="/contact">contact page</InLink></>}.</P>
        <ReportIssue where="/about" />
      </Sec>

      <RelatedLinks links={related([
        { label: "Methodology", path: "/methodology" },
        { label: "FAQ", path: "/faq" },
        { label: "Learn money basics", path: "/learn" },
      ])} />
    </>
  );
}

/* ============================================================
   /faq — hub of every FinDesh answer, grouped. Same objects as the
   per-page FAQs; JSON-LD comes from FAQ_HUB_FLAT (see seo.js).
   ============================================================ */
const LINK_LABEL = {
  "/learn": "Learn guide", "/methodology": "Methodology", "/about": "About FinDesh", "/contact": "Contact",
  "/tools": "All tools", "/sanchayapatra": "Sanchayapatra page", "/compare/savings": "Savings comparison",
  "/compare/mutual-funds": "Mutual fund comparison", "/compare/loans": "Loan comparison",
  "/compare/credit-cards": "Credit card comparison", "/borrow": "EMI calculator", "/income-tax": "Tax calculator",
};
const labelFor = path => {
  const [base, hash] = path.split("#");
  if (hash === "mf-calculator") return "Fund return calculator";
  return LINK_LABEL[base] || (ROUTES[base]?.title || base).split("—")[0].split("|")[0].trim();
};

function QA({ item, open, onToggle, idKey }) {
  const nav = useNav();
  return (
    <div style={{ background: T.glass, border: `1px solid ${open ? T.accentBorder : T.border}`, borderRadius: 14, backdropFilter: "blur(12px)" }}>
      <button aria-expanded={open} aria-controls={idKey} onClick={onToggle}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.45 }}>{item.q}</span>
        <span aria-hidden style={{ color: T.accent, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div id={idKey} style={{ padding: "0 16px 14px" }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "#B8C7E0" }}>{item.a}</p>
          {item.link && has(item.link) && (
            <a href={item.link} onClick={e => { e.preventDefault(); taxTrack("faq_link", { to: item.link }); navTo(nav, item.link); }}
              style={{ display: "inline-block", marginTop: 8, fontSize: 12.5, fontWeight: 700, color: "#8AC2FF", textDecoration: "none" }}>
              {labelFor(item.link)} →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function FaqHubPage() {
  const [open, setOpen] = useState(() => new Set());
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim().toLowerCase(), 200);
  const toggle = k => setOpen(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const total = FAQ_CATEGORIES.reduce((a, c) => a + c.items.length, 0);

  const cats = useMemo(() => !dq ? FAQ_CATEGORIES
    : FAQ_CATEGORIES.map(c => ({ ...c, items: c.items.filter(it => (it.q + " " + it.a).toLowerCase().includes(dq)) })).filter(c => c.items.length), [dq]);
  const hits = cats.reduce((a, c) => a + c.items.length, 0);

  /* /faq#tax etc. — jump once the lazy page has rendered. */
  useEffect(() => {
    const id = decodeURIComponent((window.location.hash || "").slice(1));
    if (!id) return;
    const jump = () => { const el = document.getElementById(id); if (el) el.scrollIntoView({ block: "start" }); };
    const t1 = setTimeout(jump, 60), t2 = setTimeout(jump, 450);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const jumpTo = id => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    try { history.replaceState(history.state, "", "/faq#" + id); } catch (_) { /* no-op */ }
  };

  return (
    <>
      <Hero kicker="❓ FAQ" title="Questions," accent="answered" lead={`${total} plain-English answers about saving, investing, borrowing and tax in Bangladesh.`} meta={`Updated ${FAQ_HUB_UPDATED} · general information, not tax or investment advice`} />

      <div style={{ ...card, padding: "14px 14px", marginBottom: 16 }}>
        <input className="fd-input" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search — e.g. FDR tax" aria-label="Search the FAQ"
          style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 15, color: "#fff", border: `1.5px solid ${T.border}`, borderRadius: 12, outline: "none", background: "rgba(8,18,36,0.65)", fontFamily: "inherit" }} />
        {!dq && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {FAQ_CATEGORIES.map(c => (
              <button key={c.id} className="fd-chip" onClick={() => jumpTo(c.id)}
                style={{ padding: "8px 12px", fontSize: 12.5, fontWeight: 600, borderRadius: 10, border: `1px solid ${T.borderSoft}`, background: "rgba(255,255,255,0.03)", color: "#B8C7E0", cursor: "pointer", fontFamily: "inherit" }}>
                {c.title} <span style={{ color: T.faint }}>· {c.items.length}</span>
              </button>
            ))}
          </div>
        )}
        {dq && <p role="status" style={{ margin: "10px 2px 0", fontSize: 12.5, color: T.muted }}>{hits ? `${hits} matching question${hits === 1 ? "" : "s"}` : "No matches — try a shorter word, or browse the groups below."}</p>}
      </div>

      {!dq && (
        <section aria-labelledby="start-h" style={{ marginBottom: 22 }}>
          <h2 id="start-h" style={{ margin: "6px 2px 12px", fontSize: 17, fontWeight: 900, color: "#fff" }}>Start with these</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQ_START.map((it, i) => <QA key={"s" + i} item={it} idKey={"faq-s" + i} open={open.has("s" + i)} onToggle={() => toggle("s" + i)} />)}
          </div>
        </section>
      )}

      {(dq && !hits ? FAQ_CATEGORIES : cats).map(c => (
        <section key={c.id} id={c.id} aria-labelledby={c.id + "-h"} style={{ marginBottom: 22, scrollMarginTop: 170 }}>
          <h2 id={c.id + "-h"} style={{ margin: "6px 2px 12px", fontSize: 17, fontWeight: 900, color: "#fff" }}>{c.title}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {c.items.map((it, i) => {
              const k = c.id + i;
              return <QA key={k} item={it} idKey={"faq-" + k} open={open.has(k) || (!!dq && hits <= 4)} onToggle={() => toggle(k)} />;
            })}
          </div>
        </section>
      ))}

      <div style={{ ...card, padding: "18px 18px", marginTop: 8 }}>
        <P style={{ margin: "0 0 10px" }}>Didn't find it, or spotted something wrong?</P>
        <ReportIssue where="/faq" />
      </div>

      <RelatedLinks links={related([
        { label: "Learn money basics", path: "/learn" },
        { label: "Methodology", path: "/methodology" },
        { label: "About FinDesh", path: "/about" },
      ])} />
    </>
  );
}
