/* ============================================================
   /learn — FinDesh's plain-English money guide for Bangladesh.
   Lazy-loaded (React.lazy in App.jsx) so none of this text or the
   compounding calculator lands in the initial bundle.

   SOURCING RULE: every number on this page is either computed from the
   app's existing, dated data arrays (INSTRUMENTS, SAVINGS, CMP_*,
   CMP_MUTUAL_FUNDS) or quoted from facts already verified elsewhere in
   the app (Blueprint, /income-tax, /find-your-dream-job). Nothing new
   is asserted here. If a data array changes, this page follows it.

   Bangla: TOC labels and the glossary carry standard Bangla terms.
   They should be reviewed by a native speaker before being relied on
   for Bangla search (flagged in the sprint report).
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  T, card, pill, h1, sub, gradText, chip, lbl, bigInput, taka, inflationNote,
  FAQ, RelatedLinks, TabDisclaimer, useNav, taxTrack, fmt, fmtFull, calcEMI,
  INFLATION, POLICY_RATE, LAST_UPDATED, INSTRUMENTS, SAVINGS, CMP_SAVINGS, CMP_CARDS,
  CMP_MUTUAL_FUNDS, MF_UPDATED, MF_BENCH, CMP_UPDATED, FY_2025_26, FY_2026_27, GUIDE_GREEN,
} from "../App.jsx";
import { ROUTES } from "../seo.js";
import { LEARN_FAQ, LEARN_REVIEWED } from "../content/faqs.js";

/* Only link to routes that exist, so this page never ships a dead link even
   if it is deployed before the pages it points to. */
const has = path => !!ROUTES[path];
import { useDebounced, useMediaQuery, toAmount } from "../hooks.js";

/* ---------- facts derived from the app's own data ---------- */
const byId = id => INSTRUMENTS.find(i => i.id === id) || {};
const SP5 = byId("sanchayapatra"), SP3M = byId("sp3m"), FDR = byId("fdr"), TBOND = byId("tbond"), WEDB = byId("wedb"), GOLD = byId("gold");
const POSTAL = SAVINGS.find(s => s.id === "postal") || {};
const DPS_TOP = SAVINGS.filter(s => s.id !== "postal").reduce((a, s) => (s.rate > a.rate ? s : a), { rate: 0 });
const SAV_MIN = Math.min(...CMP_SAVINGS.filter(s => s.minRate != null).map(s => s.minRate));
const SAV_MAX = Math.max(...CMP_SAVINGS.filter(s => s.maxRate != null).map(s => s.maxRate));
const APRS = CMP_CARDS.map(c => parseFloat(c.apr)).filter(n => isFinite(n));
const APR_MIN = Math.min(...APRS), APR_MAX = Math.max(...APRS);
const MF_LOSERS = CMP_MUTUAL_FUNDS.filter(f => f.prev < 0).length;
const MF_YTD_MIN = Math.min(...CMP_MUTUAL_FUNDS.map(f => f.ytd)), MF_YTD_MAX = Math.max(...CMP_MUTUAL_FUNDS.map(f => f.ytd));
const MF_PREV_MIN = Math.min(...CMP_MUTUAL_FUNDS.map(f => f.prev)), MF_PREV_MAX = Math.max(...CMP_MUTUAL_FUNDS.map(f => f.prev));
const pc = (n, d = 1) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(d) + "%";

/* ---------- small building blocks ---------- */
function TryIt({ label, path, section }) {
  const nav = useNav();
  const [base, hash] = path.split("#");
  if (!has(base)) return null;
  const go = () => {
    taxTrack("learn_try_it", { section, to: path });
    nav(base);
    /* The router navigates by path only; restore the #anchor so the target page can jump to it. */
    if (hash) { try { history.replaceState(history.state, "", base + "#" + hash); } catch (_) { /* no-op */ } }
  };
  return (
    <button className="fd-chip" onClick={go}
      style={{ marginTop: 14, padding: "10px 16px", fontSize: 13, fontWeight: 700, borderRadius: 11, border: `1px solid ${T.accentBorder}`, background: T.accentSoft, color: "#8AC2FF", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
      ▶ Try it: {label} →
    </button>
  );
}
function NotAdvice() {
  return <p style={{ margin: "12px 0 0", fontSize: 11.5, color: T.faint, fontStyle: "italic" }}>General information, not tax or investment advice.</p>;
}
const P = ({ children }) => <p style={{ margin: "0 0 12px", fontSize: 14.5, lineHeight: 1.75, color: "#B8C7E0" }}>{children}</p>;
const B = ({ children }) => <b style={{ color: "#fff" }}>{children}</b>;

function MiniTable({ head, rows, note }) {
  /* First column pinned (Deep Navy, opaque) so row labels stay visible while the
     numbers scroll sideways on a phone; the hint only shows if it really overflows. */
  const ref = useRef(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const check = () => setOverflows(el.scrollWidth > el.clientWidth + 2);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const pin = { position: "sticky", left: 0, zIndex: 1, background: "#0A1628", boxShadow: "6px 0 8px -6px rgba(0,0,0,0.6)" };
  return (
    <div style={{ margin: "6px 0 4px" }}>
      <div ref={ref} style={{ overflowX: "auto", background: "rgba(8,18,36,0.5)", border: `1px solid ${T.borderSoft}`, borderRadius: 12 }}>
        <table className="fd-tbl" style={{ minWidth: 440 }}>
          <thead><tr>{head.map((h, j) => <th key={h} style={j === 0 ? { ...pin, paddingLeft: 12 } : undefined}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={j === 0 ? { ...pin, paddingLeft: 12, color: "#EAF1FC", fontWeight: 600 } : undefined}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {overflows && <p style={{ margin: "5px 2px 0", fontSize: 11, color: T.accent, fontWeight: 600 }}>Swipe the table sideways for more columns →</p>}
      {note && <p style={{ margin: "6px 2px 0", fontSize: 11, color: T.faint, lineHeight: 1.55 }}>{note}</p>}
    </div>
  );
}

/* ---------- compounding mini-calculator (debounced, memoised) ---------- */
function CompoundCalc() {
  const [amt, setAmt] = useState("100000");
  const [monthly, setMonthly] = useState("");
  const [rate, setRate] = useState("10");
  const [years, setYears] = useState(10);
  const dAmt = useDebounced(amt), dMon = useDebounced(monthly), dRate = useDebounced(rate);

  const r = useMemo(() => {
    const P0 = toAmount(dAmt), M = toAmount(dMon);
    const rr = Math.min(Math.max(Number(String(dRate).replace(/[^0-9.]/g, "")) || 0, 0), 40) / 100;
    let bal = P0; const yearly = [];
    for (let m = 1; m <= years * 12; m++) {           // compounded monthly
      bal = bal * (1 + rr / 12) + M;
      if (m % 12 === 0) yearly.push(bal);
    }
    const contributed = P0 + M * years * 12;
    const real = bal / Math.pow(1 + INFLATION / 100, years);
    return { bal, contributed, growth: bal - contributed, real, yearly, rr, doubling: rr > 0 ? 72 / (rr * 100) : null };
  }, [dAmt, dMon, dRate, years]);

  const max = Math.max(...r.yearly, 1);
  const inStyle = { ...bigInput, fontSize: 18, padding: "12px 14px 12px 36px" };
  return (
    <div style={{ background: "rgba(8,18,36,0.55)", border: `1px solid ${T.accentBorder}`, borderRadius: 16, padding: "18px 16px", margin: "8px 0 4px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: ".09em", marginBottom: 12 }}>📈 COMPOUNDING CALCULATOR</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <div>
          <label style={lbl} htmlFor="cc-amt">Start with</label>
          <div style={{ position: "relative" }}><span style={{ ...taka, fontSize: 17, left: 14 }}>৳</span>
            <input id="cc-amt" className="fd-input" value={amt} onChange={e => setAmt(e.target.value.replace(/[^0-9,]/g, ""))} inputMode="numeric" style={inStyle} /></div>
        </div>
        <div>
          <label style={lbl} htmlFor="cc-mon">Add every month</label>
          <div style={{ position: "relative" }}><span style={{ ...taka, fontSize: 17, left: 14 }}>৳</span>
            <input id="cc-mon" className="fd-input" value={monthly} onChange={e => setMonthly(e.target.value.replace(/[^0-9,]/g, ""))} inputMode="numeric" placeholder="0" style={inStyle} /></div>
        </div>
        <div>
          <label style={lbl} htmlFor="cc-rate">Yearly return %</label>
          <input id="cc-rate" className="fd-input" value={rate} onChange={e => setRate(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" style={{ ...inStyle, paddingLeft: 14 }} />
        </div>
      </div>
      <label style={{ ...lbl, marginTop: 14 }}>Years: {years}</label>
      <input type="range" min={1} max={30} value={years} onChange={e => setYears(+e.target.value)} aria-label="Years" style={{ width: "100%", accentColor: T.accent }} />

      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 70, margin: "14px 0 6px" }} aria-hidden="true">
        {r.yearly.map((v, i) => <div key={i} style={{ flex: 1, height: `${Math.max(3, (v / max) * 100)}%`, background: `linear-gradient(180deg, ${T.accent}, rgba(79,158,255,0.25))`, borderRadius: "3px 3px 0 0" }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))", gap: 10, marginTop: 8 }}>
        {[["After " + years + " yrs", fmtFull(r.bal), "#fff"], ["You put in", fmtFull(r.contributed), "#C9D8F0"], ["Growth", fmtFull(r.growth), T.green], ["In today's money*", fmtFull(r.real), T.amber]].map(([l, v, c]) => (
          <div key={l} style={{ background: T.glassFlat, border: `1px solid ${T.borderSoft}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 10.5, color: T.faint, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase" }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: c, marginTop: 3, wordBreak: "break-word" }}>{v}</div>
          </div>
        ))}
      </div>
      <p style={{ margin: "10px 2px 0", fontSize: 11.5, color: T.faint, lineHeight: 1.6 }}>
        Compounded monthly at the rate you enter — the 10% is only an example, not a promise from any product. {r.doubling ? <>At {(r.rr * 100).toFixed(1)}% the rule of 72 says money doubles in about <b style={{ color: T.muted }}>{r.doubling.toFixed(1)} years</b>. </> : null}
        *Today's money divides by FinDesh's ~{INFLATION}% inflation assumption each year. Tax and fees are not included.
      </p>
    </div>
  );
}

/* ---------- glossary (English + Bangla) ---------- */
const GLOSSARY = [
  ["Annual fee", "বার্ষিক ফি", "What a credit card charges each year just to keep it, whether you use it or not."],
  ["APR", "বার্ষিক সুদের হার", "The yearly interest rate charged on a credit card balance you don't pay off by the due date."],
  ["Asset management company (AMC)", "সম্পদ ব্যবস্থাপক কোম্পানি", "The licensed company that runs a mutual fund and decides what it invests in."],
  ["Budget", "বাজেট", "A plan for where each month's income goes before you spend it."],
  ["Closed-end fund", "মেয়াদি মিউচুয়াল ফান্ড", "A fund with a fixed number of units that trade on the stock exchange like a share, so its price can differ from its NAV."],
  ["Compound interest", "চক্রবৃদ্ধি সুদ", "Earning a return on your earlier returns, not just on the money you put in."],
  ["Credit card", "ক্রেডিট কার্ড", "A card that lets you borrow up to a limit and charges interest on any balance left unpaid after the due date."],
  ["CIB report", "সিআইবি রিপোর্ট", "Bangladesh Bank's credit record of your loans and cards, which lenders check before approving you."],
  ["Diversification", "বৈচিত্র্যকরণ", "Spreading money across different investments so one bad result doesn't sink everything."],
  ["Dividend", "লভ্যাংশ", "Cash a fund or company pays out to its holders. Bangladeshi funds usually state it as a percentage of a unit's face value (৳10 for most funds), not of its NAV."],
  ["DPS", "ডিপিএস", "Deposit Pension Scheme: you deposit a fixed amount every month for a set term and get it back with profit at maturity."],
  ["Emergency fund", "জরুরি তহবিল", "Three to six months of expenses kept somewhere safe and reachable, for job loss or a medical bill."],
  ["EMI", "কিস্তি (ইএমআই)", "Equated Monthly Instalment: the fixed amount you repay each month on a loan, covering interest and principal."],
  ["Exit load", "এক্সিট লোড", "A charge some funds deduct when you sell your units, shown as a percentage."],
  ["FDR", "স্থায়ী আমানত (এফডিআর)", "Fixed Deposit Receipt: a lump sum locked with a bank for a set term at a set rate."],
  ["Flat rate", "ফ্ল্যাট রেট", "Interest charged on the original loan amount for the whole term, even as you repay it. More expensive than it sounds."],
  ["Income tax", "আয়কর", "Tax on your yearly income above the tax-free limit, calculated in slabs."],
  ["Inflation", "মূল্যস্ফীতি", "How fast prices rise. If inflation is higher than your return, your money buys less each year."],
  ["Interest", "সুদ", "The price of money: what a bank pays you on deposits, or charges you on a loan."],
  ["Liquidity", "তারল্য", "How quickly you can turn something into cash without losing value."],
  ["Lock-in period", "লক-ইন মেয়াদ", "How long your money must stay invested before you can withdraw it on the original terms."],
  ["Lump sum", "এককালীন", "One single amount invested at once, as opposed to monthly instalments."],
  ["Maturity", "মেয়াদপূর্তি", "The date a deposit or certificate ends and pays you back."],
  ["Minimum tax", "ন্যূনতম কর", "The smallest tax a filer above the tax-free limit must pay, even if rebates would take it lower."],
  ["Mutual fund", "মিউচুয়াল ফান্ড", "A pool of many people's money invested by a professional manager. You own units; nothing is guaranteed."],
  ["NAV", "নিট সম্পদ মূল্য (এনএভি)", "Net Asset Value: what one unit of a fund is worth — everything it owns, minus what it owes, divided by the units."],
  ["Open-end fund", "বে-মেয়াদি মিউচুয়াল ফান্ড", "A fund you buy from and sell back to the asset manager directly, at NAV-linked prices."],
  ["Policy rate", "নীতি সুদহার", "The rate Bangladesh Bank sets for lending to banks; it pushes deposit and loan rates up or down."],
  ["Principal", "আসল", "The original amount you invest or borrow, before any interest or profit."],
  ["Profit (মুনাফা)", "মুনাফা", "The return on Sanchayapatra and Islamic products; Islamic products earn it through profit-sharing rather than fixed interest."],
  ["Provident fund", "ভবিষ্য তহবিল", "Retirement savings built from your and your employer's monthly contributions."],
  ["Real return", "প্রকৃত রিটার্ন", "Your return after inflation. Roughly: your rate minus the inflation rate."],
  ["Reducing balance", "ক্রমহ্রাসমান স্থিতি", "Interest charged only on what you still owe, so it falls as you repay. Standard for Bangladeshi consumer loans."],
  ["Risk", "ঝুঁকি", "The chance that an investment returns less than you expected — or loses money."],
  ["Sanchayapatra", "সঞ্চয়পত্র", "Government savings certificates: guaranteed rates, set terms and purchase limits."],
  ["Savings account", "সঞ্চয়ী হিসাব", "A bank account for everyday savings. Easy to reach, but pays a low rate."],
  ["Shariah-compliant", "শরিয়াহসম্মত", "Run under Islamic finance rules: no interest, and no investment in prohibited sectors."],
  ["SIP", "এসআইপি", "Systematic Investment Plan: investing a fixed amount into a fund every month instead of one lump sum."],
  ["Source tax", "উৎসে কর", "Tax deducted before profit reaches you — for example on Sanchayapatra and FDR profit."],
  ["Tax rebate", "কর রেয়াত", "A cut in your income tax for money put into eligible investments such as Sanchayapatra or DPS."],
  ["Tax return", "আয়কর রিটার্ন", "The yearly statement of income you file with the National Board of Revenue."],
  ["Taxable income", "করযোগ্য আয়", "Income left after exemptions, which tax slabs are applied to."],
  ["TIN", "টিআইএন", "Taxpayer Identification Number, needed to file a return and for many financial products."],
  ["Unit", "ইউনিট", "One share of a mutual fund. Its price is the NAV."],
];

function Glossary() {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return GLOSSARY.filter(([en, bn, d]) => !s || en.toLowerCase().includes(s) || bn.includes(q.trim()) || d.toLowerCase().includes(s));
  }, [q]);
  return (
    <div>
      <input className="fd-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search a term — English or বাংলা" aria-label="Search glossary"
        style={{ ...bigInput, fontSize: 15, fontWeight: 600, padding: "12px 14px", marginBottom: 12 }} />
      <dl style={{ margin: 0, display: "grid", gap: 8 }}>
        {list.map(([en, bn, d]) => (
          <div key={en} style={{ background: T.glassFlat, border: `1px solid ${T.borderSoft}`, borderRadius: 12, padding: "11px 13px" }}>
            <dt style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 10px" }}>
              <b style={{ color: "#fff", fontSize: 14 }}>{en}</b>
              <span lang="bn" style={{ color: "#8AC2FF", fontSize: 13.5 }}>{bn}</span>
            </dt>
            <dd style={{ margin: "4px 0 0", fontSize: 13, lineHeight: 1.6, color: "#B8C7E0" }}>{d}</dd>
          </div>
        ))}
        {list.length === 0 && <p style={{ fontSize: 13, color: T.faint }}>No term matches “{q}”.</p>}
      </dl>
      <p style={{ margin: "10px 2px 0", fontSize: 11, color: T.faint }}>{GLOSSARY.length} terms. Bangla terms are standard usage; suggestions welcome via Get in Touch.</p>
    </div>
  );
}

/* ---------- the sections ---------- */
function buildSections(homeEmi) {
  const R25 = FY_2025_26, R26 = FY_2026_27;
  return [
    { id: "why-hard", t: "Why money feels hard here", body: <>
      <P>If you earn a decent salary and still feel stuck, it's not a personal failing. Three things work against people in Bangladesh at once. Prices rise fast — FinDesh uses an inflation assumption of about <B>{INFLATION}%</B> — while a regular savings account pays roughly <B>{SAV_MIN}–{SAV_MAX}%</B>, so cash left sitting quietly loses value. Family obligations are real and rarely planned for. And most of the advice you'll find online is written for other countries, with products that don't exist here.</P>
      <P>The good news is that the fixes are mostly boring and repeatable: know where each month's money goes, keep a safety buffer, avoid expensive debt, and put long-term money somewhere that beats inflation. Each section below covers one piece and links to a FinDesh tool so you can try it with your own numbers.</P>
    </>, tryIt: ["the Money Blueprint", "/blueprint"] },

    { id: "budgeting", t: "Budgeting for Dhaka costs", bn: "বাজেট", body: <>
      <P>Budgets that feel like punishment get abandoned. A better approach is to decide your split once, automate the saving part, and spend the rest without guilt. FinDesh's starting template for a Dhaka salaried professional is <B>55%</B> fixed costs, <B>20%</B> savings and investments, <B>20%</B> guilt-free spending and <B>5%</B> to top up your emergency fund.</P>
      <P>Housing is usually what breaks the template. A two-bedroom flat in a mid-range Dhaka area runs about <B>৳25–45K</B> a month, so 55% for fixed costs assumes sharing or living a little further out. If rent pushes your fixed costs to 70%, keep saving alive at even 5–10% — the habit matters more than the number.</P>
    </>, tryIt: ["the salary split calculator", "/blueprint"] },

    { id: "emergency-fund", t: "Your emergency fund", bn: "জরুরি তহবিল", body: <>
      <P>Before investing anything, set aside money for the month that goes wrong — a job loss, a hospital bill, an urgent trip home. FinDesh suggests <B>three months</B> of expenses as a bare minimum, <B>six</B> as the target and twelve if your income is irregular.</P>
      <P>Keep it reachable within a few days but out of easy spending range: a separate savings account or a short, auto-renewing FDR at a strong bank. Not Sanchayapatra, which is designed to be held for years, and not your everyday mobile wallet. Its job is to stop an emergency from turning into a high-interest loan.</P>
    </>, tryIt: ["the emergency fund calculator", "/blueprint"], extra: ["Read the full guide", "/guides/emergency-fund-dhaka"] },

    { id: "saving-options", t: "Saving options: DPS, FDR, Sanchayapatra, MSS", bn: "সঞ্চয়", advice: true, body: <>
      <P>These are the guaranteed-rate options most people use. The main differences are how you pay in (monthly or lump sum), how long the money is locked, and who backs it.</P>
      <MiniTable head={["Option", "Rate (as listed)", "Minimum", "Term"]} rows={[
        ["Savings account", `${SAV_MIN}–${SAV_MAX}%`, "—", "None"],
        ["DPS (monthly)", `up to ${DPS_TOP.rate}%`, fmt(500) + "/month", "about 1–10 yrs"],
        ["FDR (lump sum)", FDR.rateLabel, fmt(FDR.min), FDR.horizon],
        ["Sanchayapatra, 5-year", SP5.rateLabel, fmt(SP5.min), SP5.horizon],
        ["Sanchayapatra, 3-month profit", SP3M.rateLabel, fmt(SP3M.min), "3 years"],
        ["Postal savings", POSTAL.rateLabel, fmt(POSTAL.min), POSTAL.terms],
      ]} note={`Rates as listed in FinDesh, checked ${LAST_UPDATED}; Sanchayapatra rates are the January 2026 revision (5-year: 11.80% above ৳7.5 Lakh). Savings account and DPS rates vary by bank and balance.`} />
      <P><B>MSS</B> (Monthly Savings Scheme) is the name some banks use for a monthly scheme that works like a DPS — compare it the same way. Profit on Sanchayapatra has source tax of {SP5.taxNote.split(" · ")[0].replace(" source tax", "")} deducted, and FDR profit {FDR.taxNote.replace(" source tax", "")}, so the amount you receive is lower than the headline rate.</P>
    </>, tryIt: ["the Save planner", "/save"], extra: ["FDR vs DPS vs Sanchayapatra", "/guides/fdr-vs-dps-vs-sanchayapatra"] },

    { id: "inflation", t: "Interest vs inflation: your real return", bn: "মূল্যস্ফীতি", body: <>
      <P>A return only matters after inflation. The rough check is your rate minus inflation. With FinDesh's ~{INFLATION}% assumption, an FDR at 10% leaves a real return of about <B>{(10 - INFLATION).toFixed(1)}%</B>; a savings account at {SAV_MAX}% leaves about <B>{(SAV_MAX - INFLATION).toFixed(1)}%</B> — your balance grows while what it buys shrinks.</P>
      <P>The ~{INFLATION}% figure is FinDesh's single planning assumption, based on early-2026 figures (point-to-point about 8.58% in January, twelve-month average about 8.66%). Bangladesh Bank held its policy rate at {POLICY_RATE}% through the first half of 2026, which is why deposit rates are relatively high right now.</P>
    </>, tryIt: ["the inflation check", "/blueprint"] },

    { id: "compounding", t: "Compounding, live", bn: "চক্রবৃদ্ধি", body: <>
      <P>Compounding means your returns start earning returns. It's slow for the first few years and then speeds up, which is why starting early beats starting big. Change the numbers below and watch the later bars grow faster than the early ones.</P>
      <CompoundCalc />
    </>, tryIt: ["the DPS planner", "/save"] },

    { id: "investing", t: "Investing options at a glance", bn: "বিনিয়োগ", advice: true, body: <>
      <P>Investing is for money you won't need for several years. In rough order from safest to riskiest:</P>
      <MiniTable head={["Option", "As listed", "Note"]} rows={[
        ["Sanchayapatra", SP5.rateLabel, "Government-backed, fixed rate, purchase limits"],
        ["Wage Earner Development Bond", WEDB.rateLabel, "For people earning abroad; tax-exempt"],
        ["Treasury bonds and bills", TBOND.rateLabel, "Government debt, bought through a bank"],
        ["Mutual funds", "No fixed rate", `2026 so far: ${pc(MF_YTD_MIN)} to ${pc(MF_YTD_MAX)} across the 20 largest`],
        ["Listed shares (DSE)", "No fixed rate", "Real ownership, real price swings"],
        ["Gold", GOLD.rateLabel, "Holds value when the taka weakens; long-run gains are lower than recent spikes"],
      ]} note={`Fixed-rate figures as listed in FinDesh (${LAST_UPDATED}); mutual fund range from the ${MF_UPDATED} snapshot. Shares and funds have no promised return.`} />
    </>, tryIt: ["the Invest planner", "/invest"] },

    { id: "mutual-funds", t: "Mutual funds explained", bn: "মিউচুয়াল ফান্ড", advice: true, body: <>
      <P>A mutual fund pools money from many people, and a licensed asset management company invests it in shares, bonds and deposits. You own <B>units</B>, and each unit is worth the fund's <B>NAV</B> — everything the fund holds, minus what it owes, divided by the number of units.</P>
      <P><B>Open-end vs closed-end.</B> Open-end funds are bought from and sold back to the asset manager at NAV-linked prices. Closed-end funds have a fixed number of units that trade on the Dhaka Stock Exchange, so their market price can sit above or below NAV.</P>
      <P><B>SIP vs lump sum.</B> A lump sum goes in at one price. A monthly plan (often called an SIP) buys a little every month, so you buy more units when prices are low and fewer when they're high. Ask the asset manager whether it offers one.</P>
      <P><B>Fees and dividends.</B> Some funds charge an exit load when you sell — in the FinDesh snapshot it ranges from 0% to {Math.max(...CMP_MUTUAL_FUNDS.map(f => parseFloat(f.exitLoad)))}%. Bangladeshi funds usually declare dividends as a percentage of a unit's face value (৳10 for most funds), not of the current NAV — so on a ৳10 unit a "10% dividend" is ৳1.</P>
      <P><B>Shariah funds</B> follow Islamic investment screens: no interest-bearing instruments and no prohibited sectors. Confirm the certification with the asset manager.</P>
    </>, tryIt: ["compare 20 mutual funds", "/compare/mutual-funds"], extra: ["What NAV means", "/guides/what-is-nav"] },

    { id: "risk", t: "Risk, with real numbers", bn: "ঝুঁকি", advice: true, body: <>
      <P>Risk is easiest to understand in numbers you can check. Among the 20 largest open-end mutual funds, <B>{MF_LOSERS} lost money in 2025</B> — returns that year ran from {pc(MF_PREV_MIN)} to {pc(MF_PREV_MAX)}. In 2026 up to {MF_UPDATED}, the same funds ran from {pc(MF_YTD_MIN)} to {pc(MF_YTD_MAX)}, and the DSEX index was up {MF_BENCH.dsexYtd}%.</P>
      <P>Two lessons follow. A good year tells you little about the next one, so never pick a fund on one column. And money you'll need within about three years belongs in guaranteed options, not the market. Separately, be wary of any bank offering deposit rates far above its peers: a strong bank doesn't need to chase you.</P>
    </>, tryIt: ["the past-return calculator", "/compare/mutual-funds#mf-calculator"] },

    { id: "loans", t: "Loans and EMI", bn: "ঋণ ও কিস্তি", advice: true, body: <>
      <P>An EMI is the fixed monthly repayment on a loan. Bangladeshi consumer loans are usually priced on a <B>reducing balance</B>, so interest falls as you repay — always ask, because the same number quoted "flat" costs much more. Personal-loan rates in FinDesh's comparison run roughly 10% to 18%; a loan secured against your salary, FDR or DPS is usually cheaper than an unsecured one.</P>
      <P>Small rate gaps matter on big loans. On a <B>৳50 Lakh, 20-year</B> home loan, 10% instead of 11% means an EMI of <B>{fmtFull(homeEmi.e10)}</B> instead of <B>{fmtFull(homeEmi.e11)}</B> — about <B>{fmtFull(homeEmi.saving)}</B> less over the life of the loan. Get the rate in writing and negotiate.</P>
    </>, tryIt: ["the EMI calculator", "/borrow"], extra: ["Compare loan rates", "/compare/loans"] },

    { id: "credit-cards", t: "Credit cards", bn: "ক্রেডিট কার্ড", body: <>
      <P>A credit card is free if you pay the full statement balance by the due date. Leave a balance and interest applies — <B>{APR_MIN}–{APR_MAX}%</B> a year across the cards FinDesh compares. Paying only the minimum keeps the rest of the balance building interest at that rate.</P>
      <P>Pick by how you'll actually use it: if you might carry a balance, the interest rate matters most; if you always pay in full, look at the annual fee and the perks you'll really use.</P>
    </>, tryIt: ["compare credit cards", "/compare/credit-cards"] },

    { id: "income-tax", t: "Income tax in plain terms", bn: "আয়কর", advice: true, body: <>
      <P>You pay tax only on income above the tax-free limit, in slabs. For <B>{R25.label}</B> — the return filed by 30 November 2026 — the general limit is <B>{fmtFull(R25.thresholds.general)}</B> ({fmtFull(R25.thresholds.woman)} for women and people 65+). For {R26.label} the general limit is {fmtFull(R26.thresholds.general)}. Salaried people get a third of salary exempt, capped at ৳5 Lakh.</P>
      <P>Investing in eligible options such as Sanchayapatra or a DPS earns a <B>rebate</B>: {R25.rebate.rate * 100}% of the investment in {R25.label} ({R26.rebate.rate * 100}% in {R26.label}), capped at 3% of taxable income and a fixed ceiling. Above the limit there's a minimum tax — ৳5,000 in Dhaka and Chattogram city corporations. Filing between 1 July and 30 September earns a 5% rebate on the tax, up to ৳25,000.</P>
    </>, tryIt: ["the income tax calculator", "/income-tax"] },

    { id: "earning-more", t: "Earning more", bn: "আয় বাড়ানো", body: <>
      <P>There's a floor on how much you can cut, but no ceiling on what you can earn — so a better salary is one of the strongest levers in personal finance. In Bangladesh, pay is mostly set when you're hired and then moves with yearly increments, promotion or changing jobs, which makes the offer conversation one of the few moments your salary is genuinely flexible.</P>
      <P>Start by finding your market rate from live job postings and people doing the same job elsewhere, rebuild your CV around results rather than duties, and decide where a raise goes before it arrives — otherwise it quietly disappears into spending.</P>
    </>, tryIt: ["the earn-more playbook", "/find-your-dream-job"] },

    { id: "order", t: "What to do first", bn: "অগ্রাধিকার", advice: true, body: <>
      <ol style={{ margin: "0 0 12px", paddingLeft: 20, color: "#B8C7E0", fontSize: 14.5, lineHeight: 1.8 }}>
        <li><B>Emergency fund</B> — three months first, then build to six.</li>
        <li><B>Clear expensive debt</B> — credit card balances ({APR_MIN}–{APR_MAX}% a year) and unsecured personal loans before investing.</li>
        <li><B>Automate saving</B> — a DPS or regular Sanchayapatra purchase on payday, so it happens without willpower.</li>
        <li><B>Use the tax rebate</B> — eligible investments cut your tax, so time them before 30 June.</li>
        <li><B>Invest long-term money</B> — funds or shares only with money you can leave for years.</li>
      </ol>
      <P>Revisit the plan once a year, or whenever your income changes.</P>
    </>, tryIt: ["the Money Blueprint", "/blueprint"] },

    { id: "mistakes", t: "Common mistakes and scams", bn: "ভুল ও প্রতারণা", body: <>
      <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: "#B8C7E0", fontSize: 14.5, lineHeight: 1.8 }}>
        <li>Keeping long-term savings in a savings account at {SAV_MIN}–{SAV_MAX}% while prices rise around {INFLATION}%.</li>
        <li>Chasing an unusually high deposit rate from a weak bank instead of a slightly lower one from a strong bank.</li>
        <li>Buying a fund because of one great year — the 2026 leaders and the 2025 leaders are not the same funds.</li>
        <li>Taking "0% EMI" offers without checking processing fees and what happens if a payment is late.</li>
        <li>Anyone promising a fixed high monthly return from shares, a "network" business or a tip group. Real investments don't promise fixed returns.</li>
        <li>Instant loan apps that ask for access to your contacts and photos. Borrow only from licensed banks and financial institutions.</li>
        <li>Never filing a tax return, and missing the rebate your investments already earned.</li>
      </ul>
    </>, tryIt: ["check if you're beating inflation", "/blueprint"] },

    { id: "glossary", t: "Glossary: English and বাংলা", bn: "শব্দকোষ", body: <><Glossary /></> },
  ];
}

/* ---------- table of contents ---------- */
function Toc({ sections, active, wide }) {
  const [open, setOpen] = useState(false);
  const go = (e, id) => {
    e.preventDefault();
    setOpen(false);
    /* Scroll on the next frame, after the dropdown has closed — measuring while
       it's open made the jump overshoot by the dropdown's height. */
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    try { history.replaceState(history.state, "", "#" + id); } catch (_) { /* no-op */ }
  };
  const items = [...sections.map(s => [s.id, s.t, s.bn]), ["faq", "Questions", "প্রশ্নোত্তর"]];
  const list = (
    <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {items.map(([id, t, bn]) => (
        <li key={id}>
          <a href={"#" + id} onClick={e => go(e, id)} aria-current={active === id ? "true" : undefined}
            style={{ display: "block", padding: "7px 10px", borderRadius: 8, textDecoration: "none", fontSize: 13, lineHeight: 1.35, fontWeight: active === id ? 700 : 500, color: active === id ? "#fff" : "#8A9BB8", background: active === id ? T.accentSoft : "transparent", borderLeft: `2px solid ${active === id ? T.accent : "transparent"}` }}>
            {t}{bn && <span lang="bn" style={{ display: "block", fontSize: 11.5, color: active === id ? "#8AC2FF" : T.faint, fontWeight: 500 }}>{bn}</span>}
          </a>
        </li>
      ))}
    </ol>
  );
  if (wide) {
    /* Wide screens: fixed rail to the left of the 760px content column. */
    return (
      <nav aria-label="On this page" style={{ position: "fixed", top: 168, left: "max(12px, calc(50% - 380px - 252px))", width: 232, maxHeight: "calc(100vh - 190px)", overflowY: "auto", zIndex: 30, background: "rgba(8,14,26,0.6)", border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: 8, backdropFilter: "blur(14px)" }} className="fd-menu">
        <div style={{ fontSize: 10.5, fontWeight: 800, color: T.faint, letterSpacing: ".09em", textTransform: "uppercase", padding: "6px 10px" }}>On this page</div>
        {list}
      </nav>
    );
  }
  const current = items.find(i => i[0] === active);
  /* Narrow screens: sticky collapsible bar just under the nav + tab bar (148px). */
  return (
    <nav aria-label="On this page" style={{ position: "sticky", top: 148, zIndex: 30, margin: "0 -4px 18px" }}>
      {/* The list floats (absolute) so opening/closing it never moves the page. */}
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="learn-toc"
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: "rgba(8,14,26,0.96)", color: "#C9D8F0", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(14px)", touchAction: "manipulation" }}>
        <span style={{ color: T.faint, fontWeight: 600, flexShrink: 0 }}>On this page:</span>
        <span style={{ flex: 1, minWidth: 0, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#fff" }}>{current ? current[1] : "Contents"}</span>
        <span style={{ fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div id="learn-toc" className="fd-menu" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, maxHeight: "calc(100dvh - 230px)", overflowY: "auto", background: "#0A1220", border: `1px solid ${T.border}`, borderRadius: 12, padding: 6, boxShadow: "0 18px 50px rgba(0,0,0,0.55)" }}>{list}</div>
      )}
    </nav>
  );
}

export default function LearnPage() {
  const nav = useNav();
  const wide = useMediaQuery("(min-width: 1260px)");
  const homeEmi = useMemo(() => {
    const e10 = calcEMI(5000000, 10, 20), e11 = calcEMI(5000000, 11, 20);
    return { e10, e11, saving: (e11 - e10) * 240 };
  }, []);
  const sections = useMemo(() => buildSections(homeEmi), [homeEmi]);
  const [active, setActive] = useState(sections[0].id);
  const ioRef = useRef(null);

  /* Scroll-spy: highlight the section currently under the sticky chrome. */
  useEffect(() => {
    const ids = [...sections.map(s => s.id), "faq"];
    const els = ids.map(id => document.getElementById(id)).filter(Boolean);
    ioRef.current = new IntersectionObserver(entries => {
      const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setActive(vis[0].target.id);
    }, { rootMargin: "-200px 0px -55% 0px", threshold: 0 });
    els.forEach(el => ioRef.current.observe(el));
    return () => ioRef.current && ioRef.current.disconnect();
  }, [sections]);

  /* Deep links like /learn#emergency-fund: the browser's own jump happens before
     this lazy page has rendered, so do it once the sections exist. */
  useEffect(() => {
    const id = decodeURIComponent((window.location.hash || "").slice(1));
    if (!id) return;
    const jump = () => { const el = document.getElementById(id); if (el) el.scrollIntoView({ block: "start" }); };
    /* Web fonts arriving after first paint reflow the page, so repeat the jump
       once they're ready (and once more shortly after) or it lands under the bars. */
    const t1 = setTimeout(jump, 60), t2 = setTimeout(jump, 450);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(jump);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const secStyle = { scrollMarginTop: 206, marginBottom: 16 };
  return (
    <>
      <div style={{ textAlign: "center", padding: "40px 0 16px" }}>
        <div className="fd-up" style={pill}>📚 Learn · শিখুন</div>
        <h1 className="fd-up fd-up-1" style={{ ...h1, fontSize: "clamp(28px,6vw,44px)" }}>Money in Bangladesh, <span style={gradText}>explained plainly</span>.</h1>
        <p className="fd-up fd-up-2" style={sub}>Budgeting, saving, inflation, funds, loans and tax — written for how money actually works here, with a FinDesh tool to try at every step.</p>
        <p style={{ margin: "14px 0 0", fontSize: 12, color: T.faint }}>Last reviewed {LEARN_REVIEWED} · rates as listed {LAST_UPDATED} · fund data {MF_UPDATED}</p>
      </div>

      <Toc sections={sections} active={active} wide={wide} />

      {sections.map(s => (
        <section key={s.id} id={s.id} aria-labelledby={s.id + "-h"} className="fd-up" style={{ ...card, padding: "24px 20px", ...secStyle }}>
          <h2 id={s.id + "-h"} style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.015em", lineHeight: 1.25 }}>
            {s.t}{s.bn && <span lang="bn" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#8AC2FF", marginTop: 3, letterSpacing: 0 }}>{s.bn}</span>}
          </h2>
          {s.body}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {s.tryIt && <TryIt label={s.tryIt[0]} path={s.tryIt[1]} section={s.id} />}
            {s.extra && <TryIt label={s.extra[0]} path={s.extra[1]} section={s.id} />}
          </div>
          {s.advice && <NotAdvice />}
        </section>
      ))}

      <div id="faq" style={{ scrollMarginTop: 206 }}>
        <FAQ items={LEARN_FAQ} />
      </div>

      <div style={{ ...inflationNote, marginTop: 22 }}>
        Everything here is general information about Bangladeshi financial products, not tax or investment advice. Figures are dated where they appear and change over time — confirm with the institution before you commit money.{has("/methodology") && <> See <a href="/methodology" onClick={e => { e.preventDefault(); nav("/methodology"); }} style={{ color: "#FFCE8A", fontWeight: 700 }}>how FinDesh compiles its figures</a>.</>}
      </div>

      <RelatedLinks links={[
        { label: "Money Blueprint", path: "/blueprint" },
        { label: "Save · DPS planner", path: "/save" },
        { label: "Compare mutual funds", path: "/compare/mutual-funds" },
        { label: "All tools", path: "/tools" },
      ].filter(l => has(l.path))} />
      <TabDisclaimer />
    </>
  );
}
