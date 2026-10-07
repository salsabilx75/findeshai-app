/* ============================================================
   /compare/* — loans, savings, credit cards, mutual funds.
   Moved out of App.jsx (Oct 2026) into one lazy chunk and rebuilt on the
   shared CompareKit, so all four tables behave identically.

   Page-specific framing is deliberately kept:
   - /compare/mutual-funds keeps its explainer, warning band, PAST PERF.
     header tags, red negatives and the "reading these numbers" note. The
     green "highest/lowest" marker is NOT applied to its return columns —
     outlining last year's top performer would contradict the page's own
     "one good year is a bad reason to buy" warning. It is applied to exit
     load (a cost) only.
   - /compare/savings keeps its top-rates strip and per-bank ⓘ terms.
   - /compare/loans keeps the EMI calculator above the table.
   ============================================================ */
import { useEffect, useMemo, useState } from "react";
import {
  T, card, pill, h1, sub, gradText, cta, chip, inflationNote,
  FAQ, SectionHead, RelatedLinks, UpdatedBadge, CompareDisclaimer, EMICalculator, useNav,
  CMP_UPDATED, CMP_LOANS, CMP_SAVINGS, CMP_CARDS, CMP_MUTUAL_FUNDS,
  MF_UPDATED, MF_SOURCE_URL, MF_BENCH, MF_CATEGORIES,
} from "../App.jsx";
import { LOANS_FAQ, SAVINGS_CMP_FAQ, CARDS_FAQ, MF_FAQ } from "../content/faqs.js";
import { ROUTES } from "../seo.js";
import { CompareToolbar, CompareTable, SidePicker, useCompareUrl, useSelection, sortRows, slug, listParam } from "../components/CompareKit.jsx";
import MFCalculator from "../components/MFCalculator.jsx";

const has = p => !!ROUTES[p];
const related = links => links.filter(l => has(l.path));
const nameMatch = (q, ...fields) => !q || fields.some(f => String(f || "").toLowerCase().includes(q.toLowerCase()));
const providerList = (items, keyOf, labelOf) => {
  const m = new Map();
  items.forEach(i => { const k = keyOf(i); m.set(k, { id: k, label: labelOf(i), count: (m.get(k)?.count || 0) + 1 }); });
  return [...m.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};
const Hero = ({ pillText, title, subText }) => (
  <div style={{ textAlign: "center", padding: "40px 0 16px" }}>
    <div className="fd-up" style={pill}>{pillText}</div>
    <h1 className="fd-up fd-up-1" style={{ ...h1, fontSize: "clamp(26px,5.5vw,40px)" }}>{title} <span style={gradText}>Bangladesh</span></h1>
    <p className="fd-up fd-up-2" style={sub}>{subText}</p>
  </div>
);
const CtaBox = ({ title, text, label, path }) => {
  const nav = useNav();
  return (
    <div className="fd-up" style={{ marginTop: 26, background: "linear-gradient(135deg, rgba(79,158,255,0.16), rgba(8,18,36,0.9))", border: `1px solid ${T.accentBorder}`, borderRadius: 20, padding: "24px 22px", textAlign: "center" }}>
      <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 900, color: "#fff" }}>{title}</h3>
      <p style={{ margin: "0 0 14px", fontSize: 13.5, color: T.muted, lineHeight: 1.65 }}>{text}</p>
      <button className="fd-cta" onClick={() => nav(path)} style={{ ...cta, width: "auto", padding: "14px 26px" }}>{label}</button>
    </div>
  );
};
const muted = { fontSize: 10.5, color: T.faint, fontWeight: 500, marginTop: 2, lineHeight: 1.4 };

/* ============================================================ LOANS */
const LOAN_TYPES = [["personal", "Personal"], ["home", "Home"], ["car", "Car"]];
const MID = { personal: "pmid", home: "hmid", car: "cmid" };
const LOANS = CMP_LOANS.map(l => ({ ...l, __id: slug(l.bank) }));

export function LoanComparePage() {
  const [st, set, seed] = useCompareUrl({ type: "personal", sort: "shuffle", q: "", sel: "" });
  const type = MID[st.type] ? st.type : "personal";
  const sorts = [
    { id: "shuffle", label: "Mixed order (default)" },
    { id: "rate", label: "Lowest rate first", get: l => l[MID[type]], dir: "asc" },
    { id: "name", label: "Bank name (A–Z)", get: l => l.bank, dir: "asc" },
  ];
  const rows = useMemo(() => sortRows(LOANS.filter(l => nameMatch(st.q, l.bank)), st.sort, sorts, seed), [st.q, st.sort, type, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const selection = useSelection(st, set);
  const typeLabel = LOAN_TYPES.find(t => t[0] === type)[1];
  return (
    <>
      <Hero pillText="🤝 Compare Loans · ঋণ তুলনা" title="Compare loans in" subText="Personal, home and car loan rates from 10 strong banks — side by side, with the real EMI before you ever walk into a branch." />
      <UpdatedBadge />
      <EMICalculator />
      <div style={{ marginTop: 30 }}>
        <SectionHead title="Compare rates by loan type" hint="Reducing balance · published bands" />
        <CompareToolbar page="loans" state={st} set={set} seed={seed} sorts={sorts} searchPlaceholder="Search a bank">
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {LOAN_TYPES.map(([k, label]) => (
              <button key={k} className="fd-chip" aria-pressed={type === k} onClick={() => set("type", k)} style={{ ...chip(type === k), flex: 1, minWidth: 90, padding: "11px 6px", fontSize: 13 }}>{label}</button>
            ))}
          </div>
        </CompareToolbar>
        <CompareTable page="loans" rows={rows} rowKey={l => l.__id} selection={selection}
          asOf={CMP_UPDATED} sourceNote="From each bank's published rate sheet; the date of each sheet is in the Source column."
          columns={[
            { key: "bank", label: "Bank", minW: 130, render: l => <span style={{ fontWeight: 600, color: "#EAF1FC" }}>{l.bank}</span> },
            { key: "rate", label: `${typeLabel} rate (p.a.)`, tipTitle: "Rate (p.a.)", tip: "The yearly interest rate band the bank publishes for this loan type, charged on a reducing balance. Bars use the midpoint of the band. Your own offer depends on income, employer and credit history.", minW: 170, num: l => l[MID[type]], best: "min", bar: true,
              render: l => <><span style={{ color: "#fff", fontWeight: 700 }}>{l[type]}</span>{l.note && <div style={{ ...muted, whiteSpace: "normal", maxWidth: 230, marginLeft: "auto" }}>{l.note}</div>}</> },
            { key: "src", label: "Source", minW: 110, render: l => <span style={{ color: T.faint, fontSize: 11.5 }}>{l.src}</span> },
          ]} />
        <SidePicker items={LOANS} selection={selection} noun="bank" nameOf={l => l.bank} rowsSpec={[
          ...LOAN_TYPES.map(([k, label]) => ({ label: label + " loan", num: l => l[MID[k]], best: "min", render: l => <span style={{ color: "#fff", fontWeight: 700 }}>{l[k]}</span> })),
          { label: "Note", render: l => <span style={{ fontSize: 11.5, color: T.muted }}>{l.note || "—"}</span> },
          { label: "Source", render: l => <span style={{ fontSize: 11.5, color: T.faint }}>{l.src}</span> },
        ]} />
        <div style={inflationNote}>💡 Rates are bands — your actual offer depends on income, employer and credit profile, and most are reducing-balance. A 1% lower rate on a 20-year home loan saves several lakh taka, so always negotiate and get a formal rate letter.</div>
      </div>
      <FAQ items={LOANS_FAQ} />
      <CtaBox title="Run your exact loan first" text="See the full EMI, total interest and whether it's worth it in the Borrow tool." label="Open the Borrow planner →" path="/borrow" />
      <RelatedLinks links={related([
        { label: "Borrow · EMI planner", path: "/borrow" },
        { label: "Compare savings accounts", path: "/compare/savings" },
        { label: "Compare credit cards", path: "/compare/credit-cards" },
        { label: "Learn: loans and EMI", path: "/learn" },
      ])} />
      <CompareDisclaimer />
    </>
  );
}

/* ============================================================ SAVINGS */
const SAVINGS_ROWS = CMP_SAVINGS.map(s => ({ ...s, __id: slug(s.bank) }));

export function SavingsComparePage() {
  const [st, set, seed] = useCompareUrl({ islamic: "0", sort: "shuffle", q: "" });
  const [openNote, setOpenNote] = useState(null);
  const islamicOnly = st.islamic === "1";
  const sorts = [
    { id: "shuffle", label: "Mixed order (default)" },
    { id: "rate", label: "Highest rate first", get: s => (s.rmid > 0 ? s.rmid : null), dir: "desc" },
    { id: "name", label: "Bank name (A–Z)", get: s => s.bank, dir: "asc" },
  ];
  const rows = useMemo(() => sortRows(SAVINGS_ROWS.filter(s => (!islamicOnly || s.islamic) && nameMatch(st.q, s.bank)), st.sort, sorts, seed), [islamicOnly, st.q, st.sort, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  /* Top-rates strip is a fast-scan summary, always rate-ranked whatever the table order. */
  const top3 = useMemo(() => CMP_SAVINGS.filter(s => (!islamicOnly || s.islamic) && s.rmid > 0).sort((a, b) => b.rmid - a.rmid).slice(0, 3), [islamicOnly]);
  return (
    <>
      <Hero pillText="🏦 Compare Savings · সঞ্চয় হিসাব" title="Compare savings accounts in" subText="Regular savings-account interest rates across 10 banks — see at a glance where your everyday money works hardest." />
      <UpdatedBadge />
      {top3.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.faint, letterSpacing: ".09em", textTransform: "uppercase", margin: "0 2px 10px" }}>Top rates right now</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {top3.map(s => (
              /* basis 150 so two cards still fit side by side on a 375px phone */
              <div key={s.bank} className="fd-up" style={{ ...card, padding: "14px 15px", margin: 0, flex: "1 1 150px", minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#EAF1FC", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 6 }}>{s.bank}</div>
                {/* 20px: the widest string "3.00–4.00%" measured 128px at 20px in Inter 900, against
                    136px of usable card width on a 375px phone. Don't raise without re-measuring. */}
                <div style={{ ...gradText, fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.15, wordBreak: "break-word" }}>{s.rate}</div>
                <div style={{ fontSize: 10.5, color: T.faint, fontWeight: 500, marginTop: 5, lineHeight: 1.45 }}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ ...card, padding: "20px 18px" }}>
        <CompareToolbar page="savings" state={st} set={set} seed={seed} sorts={sorts} searchPlaceholder="Search a bank">
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 12 }}>
            <input type="checkbox" checked={islamicOnly} onChange={e => set("islamic", e.target.checked ? "1" : "0")} style={{ width: 17, height: 17, accentColor: T.accent, flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, color: T.muted, fontWeight: 500 }}>Show only banks with a Shariah-compliant (Islamic) option 🕌</span>
          </label>
        </CompareToolbar>
        <CompareTable page="savings" rows={rows} rowKey={s => s.__id}
          asOf={CMP_UPDATED} sourceNote="From each bank's published deposit rate sheet; sheet dates are in the Source column."
          columns={[
            { key: "bank", label: "Bank", minW: 130, render: s => <span style={{ fontWeight: 600, color: "#EAF1FC" }}>{s.bank}</span> },
            { key: "rate", label: "Savings rate", tip: "The interest a regular savings account pays, tiered by how much you keep in it. We show the band the bank publishes; the bar uses the top of the band. Tap ⓘ for that bank's tier terms.", minW: 150,
              num: s => (s.rmid > 0 ? s.rmid : null), best: "max", bar: true,
              render: s => {
                const open = openNote === s.__id;
                return (
                  <>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: s.rmid < 0 ? T.faint : "#fff", fontWeight: 700 }}>
                      {s.rate}
                      <button aria-label={`View terms for ${s.bank}`} aria-expanded={open} onClick={() => setOpenNote(open ? null : s.__id)}
                        style={{ width: 18, height: 18, flexShrink: 0, borderRadius: "50%", cursor: "pointer", fontFamily: "inherit", fontSize: 10.5, fontWeight: 800, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1px solid ${open ? "rgba(79,158,255,0.6)" : T.border}`, background: open ? T.accentSoft : "rgba(255,255,255,0.04)", color: open ? T.accent : T.faint, padding: 0, touchAction: "manipulation" }}>i</button>
                    </span>
                    {open && <div className="fd-up" style={{ marginTop: 6, marginLeft: "auto", maxWidth: 230, background: T.glass, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 10px", fontSize: 11, fontWeight: 500, color: "#C9D8F0", lineHeight: 1.5, whiteSpace: "normal", textAlign: "left" }}>{s.note}</div>}
                  </>
                );
              } },
            { key: "islamic", label: "Islamic", minW: 80, render: s => (s.islamic ? <span style={{ color: T.green }}>☪ yes</span> : <span style={{ color: T.faint }}>—</span>) },
            { key: "src", label: "Source", minW: 110, render: s => <span style={{ color: T.faint, fontSize: 11.5 }}>{s.src}</span> },
          ]} />
      </div>
      <div style={{ ...card, padding: "22px 20px", marginTop: 16 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#fff" }}>How BD savings interest works</h3>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: "#B8C7E0" }}>
          Bangladeshi savings accounts pay interest on a <b style={{ color: "#fff" }}>tiered, daily-balance</b> basis and usually credit it twice a year. Rates are low by design (0–4%) — well below the ~8.6% inflation rate — so a savings account is for liquidity and your emergency fund, <i>not</i> for growing wealth. For that, a DPS, FDR or Sanchayapatra pays far more. Banks marked "Islamic" run a separate Shariah (Mudaraba profit-sharing) savings product alongside the conventional one.
        </p>
      </div>
      <FAQ items={SAVINGS_CMP_FAQ} />
      <CtaBox title="Make your savings actually grow" text="A DPS auto-deducts monthly and pays up to ~11%. See what yours grows to in the Save tool." label="Open the Save planner →" path="/save" />
      <RelatedLinks links={related([
        { label: "Save · DPS planner", path: "/save" },
        { label: "Sanchayapatra rates", path: "/sanchayapatra" },
        { label: "FDR vs DPS vs Sanchayapatra", path: "/guides/fdr-vs-dps-vs-sanchayapatra" },
        { label: "Emergency fund guide", path: "/guides/emergency-fund-dhaka" },
        { label: "Compare loans", path: "/compare/loans" },
        { label: "Learn: saving options", path: "/learn" },
      ])} />
      <CompareDisclaimer />
    </>
  );
}

/* ============================================================ CREDIT CARDS */
const CARD_FILTERS = [["all", "All"], ["lowapr", "Lowest APR"], ["travel", "Travel / Lounge"], ["lowfee", "Low fee"], ["rewards", "Rewards"], ["islamic", "Islamic"]];
const feeNum = c => { const m = String(c.fee).replace(/,/g, "").match(/৳\s*(\d+)/); return m ? Number(m[1]) : null; };
const aprNum = c => { const n = parseFloat(c.apr); return /%/.test(c.apr) && isFinite(n) ? n : null; };
const CARDS = CMP_CARDS.map(c => ({ ...c, __id: c.id }));
const CARD_PROVIDERS = providerList(CMP_CARDS, c => slug(c.bank), c => c.bank);

export function CreditCardComparePage() {
  const [st, set, seed] = useCompareUrl({ f: "all", prov: "", sort: "shuffle", q: "", sel: "" });
  const sorts = [
    { id: "shuffle", label: "Mixed order (default)" },
    { id: "fee", label: "Lowest annual fee", get: feeNum, dir: "asc" },
    { id: "apr", label: "Lowest interest (APR)", get: aprNum, dir: "asc" },
    { id: "name", label: "Bank name (A–Z)", get: c => c.bank + " " + c.name, dir: "asc" },
  ];
  const prov = listParam(st.prov);
  const rows = useMemo(() => sortRows(CARDS.filter(c => (st.f === "all" || c.tags.includes(st.f)) && (!prov.length || prov.includes(slug(c.bank))) && nameMatch(st.q, c.name, c.bank, c.network)), st.sort, sorts, seed), [st.f, st.prov, st.q, st.sort, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const selection = useSelection(st, set);
  return (
    <>
      <Hero pillText="💳 Compare Credit Cards · ক্রেডিট কার্ড" title="Compare credit cards in" subText="Annual fees, interest rates and headline benefits across flagship cards — tick up to 3 to compare side by side. No sales calls." />
      <UpdatedBadge />
      <div style={{ ...card, padding: "20px 18px" }}>
        <CompareToolbar page="credit-cards" state={st} set={set} seed={seed} sorts={sorts} searchPlaceholder="Search a card or bank" providers={CARD_PROVIDERS} providerLabel="Bank">
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {CARD_FILTERS.map(([k, label]) => (
              <button key={k} className="fd-chip" aria-pressed={st.f === k} onClick={() => set("f", k)} style={{ ...chip(st.f === k), flex: "0 1 auto", padding: "9px 14px", fontSize: 12.5 }}>{label}</button>
            ))}
          </div>
        </CompareToolbar>
        <CompareTable page="credit-cards" rows={rows} rowKey={c => c.__id} selection={selection}
          asOf={CMP_UPDATED} sourceNote="Fees and interest rates from each bank's published schedule of charges. Reward rates aren't published, so they show as “contact bank”."
          columns={[
            { key: "card", label: "Card", minW: 140, render: c => <><span style={{ fontWeight: 700, color: "#EAF1FC" }}>{c.name}</span><div style={muted}>{c.bank}</div></> },
            { key: "fee", label: "Annual fee", tip: "What the bank charges each year to keep the card, before any waiver. “Contact bank” means the fee isn't published online.", minW: 110, num: feeNum, best: "min", bar: true, render: c => <span style={{ color: feeNum(c) == null ? T.faint : "#fff", fontWeight: 700 }}>{c.fee}</span> },
            { key: "apr", label: "APR", tipTitle: "APR (interest rate)", tip: "The yearly interest charged on any balance you don't pay off by the due date. Pay the full statement every month and you pay no interest.", minW: 90, num: aprNum, best: "min", bar: true, render: c => <span style={{ color: aprNum(c) == null ? T.muted : "#fff", fontWeight: 700 }}>{c.apr}</span> },
            { key: "network", label: "Network", minW: 120, render: c => <span style={{ fontSize: 11.5 }}>{c.network}</span> },
            { key: "benefit", label: "Headline benefit", minW: 190, render: c => <span style={{ fontSize: 11.5, whiteSpace: "normal", display: "block", maxWidth: 230, marginLeft: "auto" }}>{c.benefit}</span> },
          ]} />
        <SidePicker items={CARDS} selection={selection} noun="card" nameOf={c => c.name + " · " + c.bank} rowsSpec={[
          { label: "Bank", render: c => c.bank },
          { label: "Network", render: c => c.network },
          { label: "Annual fee", num: feeNum, best: "min", render: c => <b style={{ color: "#fff" }}>{c.fee}</b> },
          { label: "Interest (APR)", num: aprNum, best: "min", render: c => <b style={{ color: "#fff" }}>{c.apr}</b> },
          { label: "Headline benefit", render: c => <span style={{ fontSize: 11.5 }}>{c.benefit}</span> },
          { label: "Rewards", render: () => <span style={{ fontSize: 11.5, color: T.faint }}>Contact bank</span> },
        ]} />
      </div>
      <FAQ items={CARDS_FAQ} />
      <RelatedLinks links={related([
        { label: "Compare loans", path: "/compare/loans" },
        { label: "Compare savings accounts", path: "/compare/savings" },
        { label: "Learn: credit cards", path: "/learn" },
        { label: "Money Blueprint", path: "/blueprint" },
      ])} />
      <CompareDisclaimer />
    </>
  );
}

/* ============================================================ MUTUAL FUNDS */
const FUNDS = CMP_MUTUAL_FUNDS.map(f => ({ ...f, __id: slug(f.fund), exit: parseFloat(f.exitLoad) }));
/* Pills for managers with 2+ funds; the seven single-fund managers share an
   "Other" pill so the filter row stays short on a phone (search still finds
   any manager by name). */
const amcShort = n => n.replace(/ Asset Management| Wealth Management| AML$/, "").trim(); // "ICB Asset Management" → "ICB"
const AMC_ALL = providerList(CMP_MUTUAL_FUNDS, f => slug(f.amc), f => amcShort(f.amc));
const AMC_MAIN = new Set(AMC_ALL.filter(p => p.count >= 2).map(p => p.id));
const amcKey = f => (AMC_MAIN.has(slug(f.amc)) ? slug(f.amc) : "other");
const AMC_PROVIDERS = [...AMC_ALL.filter(p => AMC_MAIN.has(p.id)), { id: "other", label: "Others", count: AMC_ALL.filter(p => !AMC_MAIN.has(p.id)).reduce((n, p) => n + p.count, 0) }];
const pct = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + "%";
const pctColor = v => (v < 0 ? T.red : v > 0 ? T.green : T.muted);
const aum = f => "৳" + (f.aum >= 1000 ? (f.aum / 1000).toFixed(1) + " bn" : f.aum + " m");

export function MutualFundComparePage() {
  const nav = useNav();
  /* /compare/mutual-funds#mf-calculator (linked from /learn): jump once the lazy
     page has rendered, and again after web fonts settle the layout. */
  useEffect(() => {
    if (window.location.hash !== "#mf-calculator") return;
    const jump = () => { const el = document.getElementById("mf-calculator"); if (el) el.scrollIntoView({ block: "start" }); };
    const t1 = setTimeout(jump, 80), t2 = setTimeout(jump, 500);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(jump);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const [st, set, seed] = useCompareUrl({ cat: "All", shariah: "0", prov: "", sort: "shuffle", q: "", sel: "" });
  const sorts = [
    { id: "shuffle", label: "Mixed order (default)" },
    { id: "aum", label: "Fund size (AUM)", get: f => f.aum, dir: "desc" },
    { id: "ytd", label: "2026 return so far", get: f => f.ytd, dir: "desc" },
    { id: "prev", label: "2025 return", get: f => f.prev, dir: "desc" },
    { id: "exit", label: "Lowest exit load", get: f => f.exit, dir: "asc" },
    { id: "name", label: "Fund name (A–Z)", get: f => f.fund, dir: "asc" },
  ];
  const shariahOnly = st.shariah === "1";
  const prov = listParam(st.prov);
  const rows = useMemo(() => sortRows(FUNDS.filter(f =>
    (st.cat === "All" || f.cat === st.cat) && (!shariahOnly || f.shariah) && (!prov.length || prov.includes(amcKey(f))) && nameMatch(st.q, f.fund, f.amc)),
    st.sort, sorts, seed), [st.cat, shariahOnly, st.prov, st.q, st.sort, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const selection = useSelection(st, set);
  const losers2025 = CMP_MUTUAL_FUNDS.filter(f => f.prev < 0).length;
  const past = "PAST PERF.";
  const retTip = "NAV-based return for that calendar period as published by the source — not an annualised 1-year or 3-year figure, and not a forecast. Negative means the fund lost value.";

  return (
    <>
      <div style={{ textAlign: "center", padding: "40px 0 16px" }}>
        <div className="fd-up" style={pill}>📊 Compare Mutual Funds · মিউচুয়াল ফান্ড</div>
        <h1 className="fd-up fd-up-1" style={{ ...h1, fontSize: "clamp(26px,5.5vw,40px)" }}>Compare mutual funds in <span style={gradText}>Bangladesh</span></h1>
        <p className="fd-up fd-up-2" style={sub}>
          The 20 largest open-end funds by size, with their real NAV and published returns. These are <b style={{ color: "#fff" }}>market-linked, not guaranteed</b> — {losers2025} of these {CMP_MUTUAL_FUNDS.length} funds lost money in 2025. Past returns tell you how a fund has behaved, never what it will pay you.
        </p>
      </div>

      <div className="fd-up" style={{ ...card, padding: "22px 20px", marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#fff" }}>New to this? What a mutual fund actually is</h3>
        <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.7, color: "#B8C7E0" }}>
          You and thousands of others put money into one pot. A professional manager invests that pot across shares, bonds and deposits, and you own <b style={{ color: "#fff" }}>units</b> of it. The unit price — the <b style={{ color: "#fff" }}>NAV</b> — moves up and down with whatever the fund owns.
        </p>
        <div style={{ display: "grid", gap: 9 }}>
          {[
            ["Why people use them", "You get spread across many companies with a small amount of money, and someone else picks the shares."],
            ["The real trade-off", "There is no promised rate. A good year can beat Sanchayapatra comfortably; a bad year can lose money outright."],
            ["Open-end vs closed-end", "These 20 are open-end — bought and sold with the asset manager at NAV. Closed-end funds trade on the DSE like a share."],
            ["How to think about it", "Money you need within 3 years should not be here. Use DPS, FDR or Sanchayapatra for that, and treat funds as long-term money."],
          ].map(([t, d]) => (
            <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: T.accent, fontSize: 13, fontWeight: 900, lineHeight: 1.6, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: 13, lineHeight: 1.6, color: "#C9D8F0" }}><b style={{ color: "#fff" }}>{t}:</b> {d}</span>
            </div>
          ))}
        </div>
        {has("/learn") && <button className="fd-chip" onClick={() => nav("/learn")} style={{ marginTop: 14, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, borderRadius: 10, border: `1px solid ${T.accentBorder}`, background: T.accentSoft, color: "#8AC2FF", cursor: "pointer", fontFamily: "inherit" }}>Mutual funds explained, step by step →</button>}
      </div>

      {/* The warning band: the line between this page and /compare/savings */}
      <div style={{ ...inflationNote, marginTop: 0, marginBottom: 16 }}>
        ⚠️ <b>Every number in this table is history, not a rate you will receive.</b> Unlike Sanchayapatra, DPS or FDR, a mutual fund promises nothing — your units can be worth less than you paid. Figures are NAV-based as published on {MF_UPDATED}.{" "}
        <a href="#mf-calculator" onClick={e => { e.preventDefault(); document.getElementById("mf-calculator")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} style={{ color: "#FFCE8A", fontWeight: 700 }}>See what ৳1 lakh would have become ↓</a>
      </div>

      <div style={{ ...card, padding: "20px 18px" }}>
        <CompareToolbar page="mutual-funds" state={st} set={set} seed={seed} sorts={sorts} searchPlaceholder="Search a fund or asset manager" providers={AMC_PROVIDERS} providerLabel="Asset manager">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {MF_CATEGORIES.map(c => (
              <button key={c} className="fd-chip" aria-pressed={st.cat === c} onClick={() => set("cat", c)} style={{ ...chip(st.cat === c), flex: "0 1 auto", minWidth: 0, padding: "8px 14px", touchAction: "manipulation" }}>{c}</button>
            ))}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 12 }}>
            <input type="checkbox" checked={shariahOnly} onChange={e => set("shariah", e.target.checked ? "1" : "0")} style={{ width: 17, height: 17, accentColor: T.accent, flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, color: T.muted, fontWeight: 500 }}>Shariah-compliant funds only 🕌</span>
          </label>
        </CompareToolbar>

        <CompareTable page="mutual-funds" rows={rows} rowKey={f => f.__id} selection={selection}
          empty={'No funds match that combination — try clearing the Shariah filter or choosing "All".'}
          asOf={MF_UPDATED} sourceNote="LankaBangla Weekly Open End Mutual Fund Review (compiled from UCB Stock Brokerage)."
          columns={[
            { key: "fund", label: "Fund", minW: 150, maxW: 180, render: f => <><span style={{ fontWeight: 600, color: "#EAF1FC" }}>{f.fund}</span><div style={muted}>{f.amc}</div></> },
            { key: "ytd", label: "2026 YTD", headNote: past, tipTitle: "2026 YTD", tip: retTip, minW: 95, num: f => f.ytd, bar: true, render: f => <span style={{ color: pctColor(f.ytd), fontWeight: 700 }}>{pct(f.ytd)}</span> },
            { key: "prev", label: "2025", headNote: past, tipTitle: "2025 return", tip: retTip, minW: 90, num: f => f.prev, bar: true, render: f => <span style={{ color: pctColor(f.prev), fontWeight: 700 }}>{pct(f.prev)}</span> },
            { key: "exit", label: "Exit load", tip: "A charge some funds take when you sell your units back, as a percentage. It comes off what you receive.", minW: 90, num: f => f.exit, best: "min", render: f => <span>{f.exitLoad}</span> },
            { key: "aum", label: "Fund size", tipTitle: "Fund size (AUM)", tip: "Assets under management: the total money the fund manages. Bigger isn't automatically better, but very small funds can be more volatile.", minW: 100, num: f => f.aum, bar: true, render: f => <span style={{ color: "#C9D8F0", fontSize: 12.5 }}>{aum(f)}</span> },
            { key: "nav", label: "NAV ৳", tipTitle: "NAV", tip: "Net Asset Value per unit: what one unit is worth. A higher NAV does not mean a better fund — funds start at different prices. Compare returns, not NAV levels.", minW: 80, render: f => <span style={{ color: "#fff", fontWeight: 700 }}>{f.nav.toFixed(2)}</span> },
            { key: "cat", label: "Category", minW: 90, render: f => <span style={{ color: f.cat ? "#C9D8F0" : T.faint, fontSize: 12 }}>{f.cat || "Not stated"}</span> },
            { key: "shariah", label: "Shariah", minW: 80, render: f => (f.shariah ? <span style={{ color: T.green }}>☪ yes</span> : <span style={{ color: T.faint }}>—</span>) },
          ]} />

        <div style={{ marginTop: 12, background: "rgba(255,180,84,0.07)", border: "1px solid rgba(255,180,84,0.28)", borderRadius: 12, padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: "#FFCE8A" }}>
            <b style={{ color: T.amber }}>Reading these numbers honestly.</b> "2026 YTD" is this year so far and "2025" is that full calendar year — they are <b>not</b> annualised 1-year or 3-year returns, because no Bangladeshi source publishes those per fund. A fund can top one column and sit near the bottom of the other, which is exactly why one good year is a bad reason to buy. Over 2026 so far the DSEX index returned {MF_BENCH.dsexYtd}% and open-end funds averaged {MF_BENCH.mfYtd}%.
          </p>
        </div>
        <p style={{ margin: "10px 2px 0", fontSize: 11, color: T.faint, lineHeight: 1.6 }}>
          All figures NAV-based, as published {MF_UPDATED} in LankaBangla's Weekly Open End Mutual Fund Review (compiled from UCB Stock Brokerage) —{" "}
          <a href={MF_SOURCE_URL} target="_blank" rel="noopener noreferrer" style={{ color: T.accent, textDecoration: "none" }}>view the source ↗</a>.
          Category and Shariah status are taken from each fund's registered name; where the name doesn't state a category we show "Not stated" rather than guess. Minimum investment and expense ratio are not published in a single verifiable place, so they are deliberately not shown — ask the asset manager directly.
        </p>

        <SidePicker items={FUNDS} selection={selection} noun="fund" nameOf={f => f.fund} rowsSpec={[
          { label: "Asset manager", render: f => f.amc },
          { label: "Category", render: f => f.cat || "Not stated" },
          { label: "NAV ৳", render: f => f.nav.toFixed(2) },
          { label: "2026 YTD (past)", render: f => <b style={{ color: pctColor(f.ytd) }}>{pct(f.ytd)}</b> },
          { label: "2025 (past)", render: f => <b style={{ color: pctColor(f.prev) }}>{pct(f.prev)}</b> },
          { label: "Exit load", num: f => f.exit, best: "min", render: f => f.exitLoad },
          { label: "Latest dividend", render: f => (f.div ? `${f.div}% of face value` : "None declared") },
          { label: "Shariah", render: f => (f.shariah ? "☪ yes" : "—") },
          { label: "Fund size", render: aum },
        ]} />
      </div>

      <MFCalculator />

      <FAQ items={MF_FAQ} />
      <div className="fd-up" style={{ marginTop: 26, background: "linear-gradient(135deg, rgba(79,158,255,0.16), rgba(8,18,36,0.9))", border: `1px solid ${T.accentBorder}`, borderRadius: 20, padding: "24px 22px", textAlign: "center" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 900, color: "#fff" }}>Want a guaranteed return instead?</h3>
        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: T.muted, lineHeight: 1.65 }}>Sanchayapatra pays ~11.8–11.98% with a government guarantee, and a DPS auto-deducts monthly at up to ~11%. No market risk.</p>
        <button className="fd-cta" onClick={() => nav("/sanchayapatra")} style={{ ...cta, width: "auto", padding: "14px 26px" }}>See Sanchayapatra rates →</button>
      </div>
      <RelatedLinks links={related([
        { label: "Save · DPS planner", path: "/save" },
        { label: "Sanchayapatra rates", path: "/sanchayapatra" },
        { label: "Learn: mutual funds", path: "/learn" },
        { label: "How to compare two funds", path: "/guides/how-to-compare-mutual-funds" },
        { label: "What NAV means", path: "/guides/what-is-nav" },
        { label: "Invest planner", path: "/invest" },
      ])} />
      <CompareDisclaimer />
    </>
  );
}
