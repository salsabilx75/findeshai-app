/* ============================================================
   /guides/* — four short guides, each answering one search question and
   ending at a FinDesh tool. One lazy chunk for all four.

   SOURCING RULE: every rate, limit and fund figure is read from the app's own
   dated arrays (INSTRUMENTS, SAVINGS, CMP_SAVINGS, CMP_MUTUAL_FUNDS, MF_BENCH)
   at render time, so a data update flows through. The only literals are the
   NAV-guide price example, transcribed from the named source with its date
   (see NAV_EXAMPLE). FAQ text lives in content/faqs.js (shared with JSON-LD).
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  T, card, pill, h1, sub, gradText, bigInput, taka, lbl, FAQ, RelatedLinks, useNav, taxTrack, fmt,
  INFLATION, LAST_UPDATED, INSTRUMENTS, SAVINGS, CMP_SAVINGS, CMP_MUTUAL_FUNDS, MF_UPDATED, MF_SOURCE_URL, MF_BENCH,
  CONTACT_EMAIL,
} from "../App.jsx";
import { ROUTES } from "../seo.js";
import { GUIDE_REVIEWED, GUIDE_DEPOSITS_FAQ, GUIDE_COMPARE_MF_FAQ, GUIDE_NAV_FAQ, GUIDE_EMERGENCY_FAQ } from "../content/faqs.js";
import { navTo, useDebounced, toAmount } from "../hooks.js";
/* Same rule as CompareKit's slug(), inlined so this chunk doesn't pull in the compare kit. */
const slug = s => String(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const has = path => !!ROUTES[String(path).split(/[?#]/)[0]];

/* ---------- facts from the app's data ---------- */
const byId = id => INSTRUMENTS.find(i => i.id === id) || {};
const SP5 = byId("sanchayapatra"), SP3M = byId("sp3m"), FDR = byId("fdr");
const DPS_LIST = SAVINGS.filter(s => s.id !== "postal").sort((a, b) => b.rate - a.rate);
const DPS_TOP = DPS_LIST[0] || { rate: 0 };
const SAV_MIN = Math.min(...CMP_SAVINGS.filter(s => s.minRate != null).map(s => s.minRate));
const SAV_MAX = Math.max(...CMP_SAVINGS.filter(s => s.maxRate != null).map(s => s.maxRate));
const fund = name => CMP_MUTUAL_FUNDS.find(f => f.fund === name);
const pc = n => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(1) + "%";
const dpsMaturity = (monthly, years, ratePct) => { const i = ratePct / 100 / 12, n = years * 12; return monthly * ((Math.pow(1 + i, n) - 1) / i); }; // same maths as the Save planner

/* NAV example — transcribed from LankaBangla's Weekly Open End Mutual Fund
   Review (MF_SOURCE_URL). 3 Sep 2026 is the snapshot the comparison uses;
   24 Sep 2026 is the next review on the same page, checked 8 Oct 2026. */
const NAV_EXAMPLE = {
  fund: "Bangladesh Fund",
  a: { date: "3 September 2026", nav: 89.82, sell: 89.00, buyback: 86.00 },
  b: { date: "24 September 2026", nav: 88.36 },
};

/* ---------- building blocks ---------- */
const P = ({ children }) => <p style={{ margin: "0 0 12px", fontSize: 14.5, lineHeight: 1.75, color: "var(--c-b8c7e0)" }}>{children}</p>;
const B = ({ children }) => <b style={{ color: "var(--c-fff)" }}>{children}</b>;
const H2 = ({ children }) => <h2 style={{ margin: "0 0 12px", fontSize: 19, fontWeight: 900, color: "var(--c-fff)", letterSpacing: "-0.015em", lineHeight: 1.25 }}>{children}</h2>;
const Sec = ({ children }) => <section className="fd-up" style={{ ...card, padding: "22px 20px", marginBottom: 16 }}>{children}</section>;
const NotAdvice = () => <p style={{ margin: "12px 0 0", fontSize: 11.5, color: T.faint, fontStyle: "italic" }}>General information, not tax or investment advice.</p>;
const List = ({ items }) => (
  <ul style={{ margin: "0 0 12px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
    {items.map((x, i) => <li key={i} style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--c-b8c7e0)" }}>{x}</li>)}
  </ul>
);

function MiniTable({ head, rows, note }) {
  const ref = useRef(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const check = () => setOverflows(el.scrollWidth > el.clientWidth + 2);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const pin = { position: "sticky", left: 0, zIndex: 1, background: "var(--c-0a1628)", boxShadow: "6px 0 8px -6px var(--c-0-0-0-6)" };
  return (
    <div style={{ margin: "6px 0 12px" }}>
      <div ref={ref} style={{ overflowX: "auto", background: "var(--c-8-18-36-5)", border: `1px solid ${T.borderSoft}`, borderRadius: 12 }}>
        <table className="fd-tbl" style={{ minWidth: 440 }}>
          <thead><tr>{head.map((h, j) => <th key={j} style={j === 0 ? { ...pin, paddingLeft: 12 } : undefined}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={j === 0 ? { ...pin, paddingLeft: 12, color: "var(--c-eaf1fc)", fontWeight: 600, whiteSpace: "normal", minWidth: 120 } : undefined}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {overflows && <p style={{ margin: "5px 2px 0", fontSize: 11, color: T.accent, fontWeight: 600 }}>Swipe the table sideways for more columns →</p>}
      {note && <p style={{ margin: "6px 2px 0", fontSize: 11, color: T.faint, lineHeight: 1.55 }}>{note}</p>}
    </div>
  );
}

function ToolCta({ label, path, guide }) {
  const nav = useNav();
  if (!has(path)) return null;
  const [base, hash] = path.split("#");
  const go = e => {
    e.preventDefault(); taxTrack("guide_tool_click", { guide, to: path });
    /* Same page (e.g. "#calc"): just scroll — the router would reset to the top. */
    if (hash && base === window.location.pathname) { const el = document.getElementById(hash); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    navTo(nav, path);
  };
  return (
    <a href={path} onClick={go}
      style={{ display: "inline-block", marginTop: 6, padding: "11px 16px", fontSize: 13.5, fontWeight: 800, borderRadius: 12, border: `1px solid ${T.accentBorder}`, background: T.accentSoft, color: "var(--c-8ac2ff)", textDecoration: "none" }}>
      ▶ {label} →
    </a>
  );
}
function InLink({ to, children }) {
  const nav = useNav();
  if (!has(to)) return <>{children}</>;
  return <a href={to} onClick={e => { e.preventDefault(); navTo(nav, to); }} style={{ color: "var(--c-8ac2ff)", fontWeight: 700, textDecoration: "none" }}>{children}</a>;
}

function GuideShell({ id, kicker, title, accent, lead, asOf, answer, children, faq, tool, related }) {
  return (
    <article>
      <div style={{ textAlign: "center", padding: "40px 0 18px" }}>
        <div className="fd-up" style={pill}>{kicker}</div>
        <h1 className="fd-up fd-up-1" style={{ ...h1, fontSize: "clamp(27px,5.6vw,40px)" }}>{title} {accent && <span style={gradText}>{accent}</span>}</h1>
        <p className="fd-up fd-up-2" style={sub}>{lead}</p>
        <p style={{ margin: "14px 0 0", fontSize: 12, color: T.faint }}>Published {GUIDE_REVIEWED} · {asOf}</p>
      </div>

      <div className="fd-up" style={{ ...card, padding: "18px 20px", marginBottom: 16, borderColor: T.accentBorder }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: ".09em", marginBottom: 8 }}>THE SHORT ANSWER</div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "var(--c-eaf1fc)" }}>{answer}</p>
        {tool && <div style={{ marginTop: 10 }}><ToolCta label={tool[0]} path={tool[1]} guide={id} /></div>}
      </div>

      {children}

      <FAQ items={faq} />
      <p style={{ margin: "16px 4px 0", fontSize: 12, color: T.faint, lineHeight: 1.6 }}>
        General information, not tax or investment advice. Spotted a wrong or outdated figure?{" "}
        <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Data issue on FinDesh: /guides/" + id)}`} onClick={() => taxTrack("data_issue_clicked", { from: "guide" })} style={{ color: T.accent, fontWeight: 600 }}>Report a data issue</a>
        {has("/methodology") && <> · <InLink to="/methodology">How we source figures</InLink></>}
      </p>
      <RelatedLinks links={related.filter(l => has(l.path))} />
    </article>
  );
}

/* ============================================================
   1 · FDR vs DPS vs Sanchayapatra
   ============================================================ */
function DepositsGuide() {
  const lump = 500000, monthly = 5000, years = 5;
  const spYear = lump * SP5.rate / 100, fdrYear = lump * FDR.rate / 100;
  const dps = dpsMaturity(monthly, years, DPS_TOP.rate);
  return (
    <GuideShell id="fdr-vs-dps-vs-sanchayapatra" kicker="📘 Guide · Saving"
      title="FDR vs DPS vs Sanchayapatra:" accent="which one, when?"
      lead="Three guaranteed-rate ways to save in Bangladesh. They differ less in rate than in how you pay in, how long you're locked, and who backs your money."
      asOf={`rates as listed ${LAST_UPDATED}`}
      answer={<>Use a <B>DPS</B> to save from your salary every month, an <B>FDR</B> for a lump sum you may need within a few years, and <B>Sanchayapatra</B> for a lump sum you can leave for 3–5 years and want government-backed. On today's listed rates, Sanchayapatra pays the most ({SP5.rateLabel}), then FDRs ({FDR.rateLabel}) and the best DPS schemes (up to {DPS_TOP.rate}%).</>}
      tool={["Compare them in the Save planner", "/save"]}
      faq={GUIDE_DEPOSITS_FAQ}
      related={[{ label: "Sanchayapatra rates & calculator", path: "/sanchayapatra" }, { label: "DPS planner", path: "/save" }, { label: "Where to invest", path: "/invest" }, { label: "Learn: saving options", path: "/learn" }]}>

      <Sec>
        <H2>Side by side</H2>
        <MiniTable head={["", "DPS", "FDR", "Sanchayapatra (5-year)"]} rows={[
          ["How you pay in", "Fixed amount every month", "One lump sum", "One lump sum"],
          ["Listed rate", `up to ${DPS_TOP.rate}%`, FDR.rateLabel, SP5.rateLabel],
          ["Minimum", fmt(500) + "/month", fmt(FDR.min), fmt(SP5.min)],
          ["Term", "About 1–10 years", FDR.horizon, SP5.horizon],
          ["Backed by", "The bank", "The bank", "The government"],
          ["Tax on profit", "Deducted at source", FDR.taxNote, SP5.taxNote?.split("·")[0].trim()],
          ["Counts for tax rebate", "Yes", "—", "Yes"],
        ]} note={`Rates as listed by each bank and the Department of National Savings, ${LAST_UPDATED}. "—" means FinDesh doesn't hold a verified answer; ask your bank.`} />
      </Sec>

      <Sec>
        <H2>What the difference looks like in taka</H2>
        <P>Same listed rates, before tax, using the same maths as FinDesh's calculators:</P>
        <List items={[
          <>{fmt(lump)} in a 5-year Sanchayapatra at {SP5.rate}% earns about <B>{fmt(spYear)} a year</B> in profit.</>,
          <>The same {fmt(lump)} in an FDR at {FDR.rate}% (a mid rate in the {FDR.rateLabel} range) earns about <B>{fmt(fdrYear)} a year</B>.</>,
          <>{fmt(monthly)} a month into a DPS at {DPS_TOP.rate}% for {years} years grows to about <B>{fmt(dps)}</B> — {fmt(monthly * years * 12)} paid in, about {fmt(dps - monthly * years * 12)} of profit.</>,
        ]} />
        <P>A gap of {(SP5.rate - FDR.rate).toFixed(2)} percentage points between Sanchayapatra and a mid-range FDR is about {fmt(spYear - fdrYear)} a year on {fmt(lump)}. That matters — but so does whether you can wait.</P>
      </Sec>

      <Sec>
        <H2>How to choose</H2>
        <List items={[
          <><B>Saving from salary?</B> A DPS turns a monthly amount into a habit. Pick a strong bank and an amount you can keep paying, because missing instalments or closing early costs you.</>,
          <><B>Have a lump sum you might need in 1–3 years?</B> An FDR lets you pick a shorter term (from {FDR.horizon.split("–")[0].trim()}) and renew it.</>,
          <><B>Have a lump sum you won't touch for years?</B> Sanchayapatra pays the most and is government-backed. The 3-month-profit version ({SP3M.rateLabel}, minimum {fmt(SP3M.min)}) pays out every quarter if you want income.</>,
          <><B>Remember the limits.</B> The 5-year Sanchayapatra caps at {fmt(SP5.max)} in one name ({fmt(SP5.maxJoint)} jointly), counted across all your purchases.</>,
          <><B>All three lock your money.</B> Breaking any of them early usually pays less than the listed rate, so keep your <InLink to="/guides/emergency-fund-dhaka">emergency fund</InLink> separate.</>,
        ]} />
        <P>Many people use more than one: a DPS for monthly saving, an FDR for money with a date on it, and Sanchayapatra for the long-term pot.</P>
        <ToolCta label="See Sanchayapatra rates and limits" path="/sanchayapatra" guide="fdr-vs-dps-vs-sanchayapatra" />
        <NotAdvice />
      </Sec>
    </GuideShell>
  );
}

/* ============================================================
   2 · How to compare two mutual funds
   ============================================================ */
function CompareFundsGuide() {
  const A = fund("UCB Income Plus Fund"), Bf = fund("Shanta Fixed Income Fund");
  const hi = fund("ICB AMCL Unit Fund");
  const ok = A && Bf;
  const link = ok ? `/compare/mutual-funds?cat=${encodeURIComponent(A.cat || "All")}&sel=${slug(A.fund)},${slug(Bf.fund)}` : "/compare/mutual-funds";
  const rows = ok ? [
    ["Category (from name)", A.cat || "Not stated", Bf.cat || "Not stated"],
    ["2026 so far", pc(A.ytd), pc(Bf.ytd)],
    ["Full year 2025", pc(A.prev), pc(Bf.prev)],
    ["Latest dividend", A.div ? `${A.div}% of face value` : "None listed", Bf.div ? `${Bf.div}% of face value` : "None listed"],
    ["Exit load", A.exitLoad, Bf.exitLoad],
    ["Fund size (AUM)", `৳${A.aum.toLocaleString("en-IN")} m`, `৳${Bf.aum.toLocaleString("en-IN")} m`],
    ["NAV per unit", `৳${A.nav.toFixed(2)}`, `৳${Bf.nav.toFixed(2)}`],
    ["Shariah (from name)", A.shariah ? "Yes" : "No", Bf.shariah ? "Yes" : "No"],
  ] : [];
  return (
    <GuideShell id="how-to-compare-mutual-funds" kicker="📘 Guide · Investing"
      title="How to compare" accent="two mutual funds"
      lead="A short checklist using only numbers that are actually published for Bangladeshi funds — and a list of what to ask the fund manager for the rest."
      asOf={`fund data ${MF_UPDATED}`}
      answer={<>Compare funds of the <B>same type</B>, look at <B>more than one period</B> of returns, set them against the market, then check the <B>exit load</B>, size and Shariah status. Ignore the NAV level. Ask the fund manager for costs and holdings, which aren't published in one place.</>}
      tool={["Compare these two side by side", link]}
      faq={GUIDE_COMPARE_MF_FAQ}
      related={[{ label: "Compare mutual funds", path: "/compare/mutual-funds" }, { label: "What NAV means", path: "/guides/what-is-nav" }, { label: "Learn: mutual funds", path: "/learn" }]}>

      <Sec>
        <H2>The checklist</H2>
        <List items={[
          <><B>1. Same type of fund.</B> An income fund (mostly fixed income) and an equity-heavy fund are built to behave differently. FinDesh only labels a category when the fund's registered name states it.</>,
          <><B>2. Two periods, not one.</B> FinDesh shows the 2026 return so far and the full-year 2025 return, from one dated source. A fund that leads one period and lags the other has results that swing.</>,
          <><B>3. Against the market.</B> Over 2026 to {MF_UPDATED}, the DSEX index returned {MF_BENCH.dsexYtd}% and open-end funds averaged {MF_BENCH.mfYtd}%. That's the bar a fund's number should be read against.</>,
          <><B>4. Exit load.</B> The charge for selling back early. If you might need the money soon, a high exit load can cancel a better return.</>,
          <><B>5. Size.</B> Fund size (AUM) tells you how much money the fund manages. It isn't a quality score.</>,
          <><B>6. Dividends.</B> Shown as a % of a unit's face value (৳10 for most funds). When a fund pays out, its NAV falls by roughly that amount, so a dividend isn't free money on top.</>,
          <><B>7. Shariah,</B> if that matters to you — then confirm the certification with the fund manager.</>,
          <><B>Skip the NAV level.</B> {hi ? <>{hi.fund}'s NAV is ৳{hi.nav.toFixed(2)} and {A?.fund}'s is ৳{A?.nav.toFixed(2)}; </> : null}neither is "cheaper". NAV depends on the launch price and history, not value for money.</>,
        ]} />
      </Sec>

      {ok && (
        <Sec>
          <H2>Example: {A.fund} vs {Bf.fund}</H2>
          <P>Both are named as income funds, so they're a fair pair. Figures from the {MF_UPDATED} weekly review.</P>
          <MiniTable head={["", A.fund, Bf.fund]} rows={rows} note={<>Past performance, not a forecast. Source: <a href={MF_SOURCE_URL} target="_blank" rel="noopener noreferrer" style={{ color: T.accent }}>LankaBangla Weekly Open End Mutual Fund Review</a>, {MF_UPDATED}.</>} />
          <P>Read it in order: {A.ytd >= Bf.ytd ? A.fund : Bf.fund} is ahead in 2026 so far, {A.prev >= Bf.prev ? A.fund : Bf.fund} was ahead in 2025, and {Bf.div && !A.div ? `${Bf.fund} paid a dividend while ${A.fund} lists none` : "their dividends differ"}. Neither result is a promise for next year. The useful finding is how differently two funds of the same type can behave.</P>
          <NotAdvice />
        </Sec>
      )}

      <Sec>
        <H2>What to ask the fund manager</H2>
        <P>These matter but aren't published per fund in one verifiable place, so FinDesh doesn't show them:</P>
        <List items={[
          "Total yearly cost (management fee and other expenses).",
          "What the fund holds, and how concentrated it is.",
          "Returns over 3 and 5 years, calculated the same way for both funds.",
          "Minimum investment, and how to buy and sell units.",
        ]} />
        <ToolCta label="Try the fund return calculator" path="/compare/mutual-funds#mf-calculator" guide="how-to-compare-mutual-funds" />
      </Sec>
    </GuideShell>
  );
}

/* ============================================================
   3 · What NAV means
   ============================================================ */
function NavGuide() {
  const E = NAV_EXAMPLE;
  const spread = E.a.sell - E.a.buyback;
  return (
    <GuideShell id="what-is-nav" kicker="📘 Guide · Investing"
      title="What NAV means, and why" accent="sites show different numbers"
      lead="NAV is the price tag on one unit of a mutual fund. Different sites can show different NAVs for the same fund — here's why, with a real example."
      asOf={`example prices ${E.a.date} and ${E.b.date}`}
      answer={<>NAV (net asset value) is what one unit of a fund is worth: everything the fund owns, minus what it owes, divided by the units in issue. Two sites usually disagree because they were <B>updated on different dates</B> or are quoting <B>a different price</B> — NAV, the selling price or the repurchase price.</>}
      tool={["Compare 20 funds' NAV and returns", "/compare/mutual-funds"]}
      faq={GUIDE_NAV_FAQ}
      related={[{ label: "Compare mutual funds", path: "/compare/mutual-funds" }, { label: "How to compare two funds", path: "/guides/how-to-compare-mutual-funds" }, { label: "Learn: mutual funds", path: "/learn" }]}>

      <Sec>
        <H2>One fund, three prices</H2>
        <P>On {E.a.date}, the weekly review listed {E.fund} like this:</P>
        <MiniTable head={["Price", "Per unit", "What it means"]} rows={[
          ["NAV", `৳${E.a.nav.toFixed(2)}`, "Value of one unit"],
          ["Selling price", `৳${E.a.sell.toFixed(2)}`, "What you pay to buy a unit"],
          ["Repurchase price", `৳${E.a.buyback.toFixed(2)}`, "What the fund pays you to buy it back"],
        ]} note={<>Source: <a href={MF_SOURCE_URL} target="_blank" rel="noopener noreferrer" style={{ color: T.accent }}>LankaBangla Weekly Open End Mutual Fund Review</a>, {E.a.date}.</>} />
        <P>A site quoting any of these three is "right" — they're just different numbers. The ৳{spread.toFixed(2)} gap between buying and selling back is a real cost: buy and sell on the same day and you'd get back about {((E.a.buyback / E.a.sell) * 100).toFixed(1)}% of what you paid.</P>
      </Sec>

      <Sec>
        <H2>Why the numbers differ between sites</H2>
        <List items={[
          <><B>Different dates.</B> NAV changes as the fund's holdings change. The same review three weeks later ({E.b.date}) listed {E.fund}'s NAV at ৳{E.b.nav.toFixed(2)}, not ৳{E.a.nav.toFixed(2)}. Always check the date.</>,
          <><B>Different price.</B> NAV, selling price or repurchase price, as above.</>,
          <><B>Market value or cost.</B> NAV is normally stated at market value; some disclosures also show it at the cost the fund paid. A site quoting the cost figure will differ.</>,
          <><B>After a dividend.</B> When a fund pays out, its NAV drops by roughly the amount paid. A site updated just before the payout and one updated just after will disagree.</>,
          <><B>Listed (closed-end) funds.</B> These trade on the stock exchange at a market price, which can sit above or below NAV.</>,
        ]} />
      </Sec>

      <Sec>
        <H2>Returns have the same problem</H2>
        <P>"Return" can mean this year so far, last calendar year, the last 12 months or since launch — four different numbers for the same fund. FinDesh shows only the two periods its source publishes, labelled exactly: <B>2026 so far</B> and <B>full-year 2025</B>. Neither is an annual return, and neither is a forecast.</P>
        <ToolCta label="See what ৳1 lakh became in each fund" path="/compare/mutual-funds#mf-calculator" guide="what-is-nav" />
        <NotAdvice />
      </Sec>
    </GuideShell>
  );
}

/* ============================================================
   4 · Emergency fund in Dhaka
   ============================================================ */
function EmergencyGuide() {
  const [exp, setExp] = useState("40000");
  const [save, setSave] = useState("10000");
  const dExp = useDebounced(exp), dSave = useDebounced(save);
  const r = useMemo(() => {
    const e = toAmount(dExp), s = toAmount(dSave);
    const months = n => (s > 0 ? Math.ceil(e * n / s) : null);
    return { e, s, t3: e * 3, t6: e * 6, t12: e * 12, m3: months(3), m6: months(6), topUp: e * 6 * INFLATION / 100 };
  }, [dExp, dSave]);
  const box = { flex: "1 1 118px", background: "var(--c-8-18-36-55)", border: `1px solid ${T.borderSoft}`, borderRadius: 12, padding: "12px 12px" };
  return (
    <GuideShell id="emergency-fund-dhaka" kicker="📘 Guide · Saving"
      title="How much emergency fund" accent="do you need in Dhaka?"
      lead="The money that stops a bad month becoming a loan. How much to keep, where to keep it, and how to build it from a salary."
      asOf={`rates as listed ${LAST_UPDATED}`}
      answer={<>Keep <B>three months</B> of essential expenses as a bare minimum and aim for <B>six</B> — up to twelve if your income is irregular or family depends on you. Keep it in a separate savings account or a short, auto-renewing FDR at a strong bank, not in Sanchayapatra and not in your daily mobile wallet.</>}
      tool={["Work out your number below", "/guides/emergency-fund-dhaka#calc"]}
      faq={GUIDE_EMERGENCY_FAQ}
      related={[{ label: "Money Blueprint", path: "/blueprint" }, { label: "Compare savings accounts", path: "/compare/savings" }, { label: "FDR vs DPS vs Sanchayapatra", path: "/guides/fdr-vs-dps-vs-sanchayapatra" }, { label: "Learn money basics", path: "/learn" }]}>

      <Sec>
        <H2>What counts as "expenses"</H2>
        <P>Use what you actually spend in a normal month on things you can't stop: rent, food, utilities and internet, transport, loan EMIs and card minimums, school fees, medicine, and money you send to family. Leave out things you'd cut in a crisis, like eating out or shopping.</P>
      </Sec>

      <section id="calc" className="fd-up" style={{ ...card, padding: "22px 20px", marginBottom: 16, scrollMarginTop: 170 }}>
        <H2>Your number</H2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div>
            <label style={lbl} htmlFor="ef-exp">Monthly essential expenses</label>
            <div style={{ position: "relative" }}><span style={taka}>৳</span>
              <input id="ef-exp" className="fd-input" value={exp} onChange={e => setExp(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" style={{ ...bigInput, fontSize: 20, padding: "13px 14px 13px 42px" }} /></div>
          </div>
          <div>
            <label style={lbl} htmlFor="ef-save">You can set aside each month</label>
            <div style={{ position: "relative" }}><span style={taka}>৳</span>
              <input id="ef-save" className="fd-input" value={save} onChange={e => setSave(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" style={{ ...bigInput, fontSize: 20, padding: "13px 14px 13px 42px" }} /></div>
          </div>
        </div>
        {r.e > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={box}><div style={{ fontSize: 11, color: T.faint, fontWeight: 700 }}>3 MONTHS · MINIMUM</div><div style={{ fontSize: 18, fontWeight: 900, color: T.amber }}>{fmt(r.t3)}</div>{r.m3 && <div style={{ fontSize: 11.5, color: T.muted }}>~{r.m3} months to build</div>}</div>
              <div style={box}><div style={{ fontSize: 11, color: T.faint, fontWeight: 700 }}>6 MONTHS · TARGET</div><div style={{ fontSize: 18, fontWeight: 900, color: T.green }}>{fmt(r.t6)}</div>{r.m6 && <div style={{ fontSize: 11.5, color: T.muted }}>~{r.m6} months to build</div>}</div>
              <div style={box}><div style={{ fontSize: 11, color: T.faint, fontWeight: 700 }}>12 MONTHS · IRREGULAR INCOME</div><div style={{ fontSize: 18, fontWeight: 900, color: "var(--c-fff)" }}>{fmt(r.t12)}</div></div>
            </div>
            <p style={{ margin: "12px 0 0", fontSize: 12.5, color: T.muted, lineHeight: 1.6 }}>If prices rise about {INFLATION}% a year (FinDesh's inflation assumption), a six-month fund needs roughly <b style={{ color: "var(--c-fff)" }}>{fmt(r.topUp)}</b> more next year to cover the same costs.</p>
          </div>
        )}
      </section>

      <Sec>
        <H2>Where to keep it</H2>
        <List items={[
          <><B>A separate savings account</B> for the first month or so — instant access. Savings accounts pay about {SAV_MIN}–{SAV_MAX}% here, so this is for access, not growth.</>,
          <><B>A short, auto-renewing FDR</B> at a strong bank for the rest — FDRs are listed at {FDR.rateLabel}, and you can usually get the money within days.</>,
          <><B>Not Sanchayapatra</B> — it's designed to be held for years. <B>Not your daily mobile wallet</B> — too easy to spend.</>,
          <><B>Not invested</B> in shares or mutual funds. They can be down exactly when you need the money.</>,
        ]} />
        <ToolCta label="Compare savings account rates" path="/compare/savings" guide="emergency-fund-dhaka" />
      </Sec>

      <Sec>
        <H2>How to build it</H2>
        <List items={[
          "Move a fixed amount on payday, before you spend anything — automatic beats willpower.",
          "Put bonuses and windfalls in until you reach three months.",
          "Pause investing (not your regular bills) until the minimum is there.",
          "Use it only for a real emergency, then refill it before anything else.",
          "Recheck the target once a year as rent and prices change.",
        ]} />
        <NotAdvice />
      </Sec>
    </GuideShell>
  );
}

/* ---------- registry ---------- */
const GUIDES = {
  "fdr-vs-dps-vs-sanchayapatra": DepositsGuide,
  "how-to-compare-mutual-funds": CompareFundsGuide,
  "what-is-nav": NavGuide,
  "emergency-fund-dhaka": EmergencyGuide,
};

export default function GuidePage({ id }) {
  /* /guides/x#calc etc. — jump after the lazy page renders. */
  useEffect(() => {
    const h = decodeURIComponent((window.location.hash || "").slice(1));
    if (!h) return;
    const jump = () => { const el = document.getElementById(h); if (el) el.scrollIntoView({ block: "start" }); };
    const t1 = setTimeout(jump, 60), t2 = setTimeout(jump, 450);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [id]);
  const G = GUIDES[id];
  return G ? <G /> : null;
}
