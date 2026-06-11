import { useState, useRef } from "react";

/* ============================================================
   FinDesh AI — Multi-page personal finance platform
   Page 1: Invest (lump sum → instruments)
   Page 2: Savings Planner (monthly goal → DPS options)
   Real BD data, July 2025–2026
   ============================================================ */

const INFLATION = 8.5;

/* ---------------- INVEST INSTRUMENTS ---------------- */
const INSTRUMENTS = [
  { id: "sanchayapatra", name: "Sanchayapatra (5-Year)", bn: "সঞ্চয়পত্র", icon: "🏛️", min: 10000, max: 3000000, risk: ["low"], rate: 11.83, rateLabel: "11.83%", liquidity: "Low", horizon: "5 years", taxNote: "5–10% source tax", blurb: "Government-guaranteed, highest safe return in Bangladesh. Rate locked at purchase for the full term.", why: "Beats inflation comfortably with zero capital risk — the anchor of any conservative portfolio.", tags: ["Govt. guaranteed", "Beats inflation"], link: "https://nationalsavings.gov.bd" },
  { id: "paribar", name: "Paribar Sanchayapatra", bn: "পরিবার সঞ্চয়পত্র", icon: "👨‍👩‍👧", min: 10000, max: 4500000, risk: ["low"], rate: 11.93, rateLabel: "11.93%", liquidity: "Low", horizon: "5 yrs (monthly payout)", taxNote: "5–10% source tax", blurb: "Monthly profit payout. For women, seniors 65+, and the disabled.", why: "If you want regular monthly income rather than lump-sum growth, this pays out monthly at a top rate.", tags: ["Monthly income", "Highest NSC rate"], link: "https://nationalsavings.gov.bd" },
  { id: "fdr", name: "Fixed Deposit (FDR)", bn: "ফিক্সড ডিপোজিট", icon: "🏦", min: 10000, max: null, risk: ["low"], rate: 9.5, rateLabel: "9–10%", liquidity: "Medium", horizon: "3 mo – 3 yrs", taxNote: "10% source tax", blurb: "Bank-fixed lump sum at near-record rates right now (repo at 10%, banks competing).", why: "More flexible tenure than Sanchayapatra. Good for money you may need within a few years.", tags: ["Flexible tenure", "High right now"], link: null },
  { id: "ifarmer", name: "iFarmer (Agri Funding)", bn: "আইফার্মার", icon: "🌾", min: 40000, max: 1000000, risk: ["low", "medium"], rate: 12, rateLabel: "8–15%", liquidity: "Low", horizon: "3–9 months", taxNote: "TIN required", blurb: "Fund verified farm projects via profit-sharing. Short cycles, insurance-backed.", why: "Above any bank deposit on short cycles, with insurance reducing downside. Start small.", tags: ["Short cycle", "Insured", "Impact"], link: "https://ifarmer.asia" },
  { id: "tbond", name: "Treasury Bond / Bill", bn: "ট্রেজারি বন্ড", icon: "📜", min: 100000, max: null, risk: ["low", "medium"], rate: 10.5, rateLabel: "10–12%", liquidity: "Medium", horizon: "91 days – 20 yrs", taxNote: "Tax on coupon", blurb: "Government debt via banks or BSEC. Sets the benchmark for all other rates.", why: "Govt-backed like Sanchayapatra but tradeable — more liquid if you may exit early.", tags: ["Govt. backed", "Tradeable"], link: null },
  { id: "mutualfund", name: "Mutual Fund", bn: "মিউচুয়াল ফান্ড", icon: "📊", min: 5000, max: null, risk: ["medium"], rate: 12, rateLabel: "8–18%", liquidity: "Medium", horizon: "2–5 years", taxNote: "Dividend mostly tax-exempt", blurb: "Professionally managed pooled fund on the DSE. Diversified without picking stocks.", why: "A managed bridge into the market — diversified, lower-effort, tax-friendly dividends.", tags: ["Diversified", "Managed"], link: "https://dsebd.org" },
  { id: "bluechip", name: "DSE Blue-Chip Shares", bn: "ব্লু-চিপ শেয়ার", icon: "📈", min: 25000, max: null, risk: ["medium", "high"], rate: 15, rateLabel: "12–25%", liquidity: "High", horizon: "1–5 years", taxNote: "No capital-gains tax", blurb: "Shares in DS30 leaders — Grameenphone, BRAC Bank, Square Pharma. DSEX up ~15% this year.", why: "Real ownership in BD's best companies, no CGT for individuals. Prices swing — invest for years.", tags: ["High liquidity", "No CGT"], link: "https://dsebd.org" },
  { id: "growth", name: "DSE Growth Stocks", bn: "গ্রোথ শেয়ার", icon: "🚀", min: 50000, max: null, risk: ["high"], rate: 25, rateLabel: "20–60%+", liquidity: "High", horizon: "6 mo – 3 yrs", taxNote: "No capital-gains tax", blurb: "Smaller high-growth listed firms. Big upside, real downside — DSE has boom/bust history.", why: "Where the largest returns live, and where people lose money. Only money you can lock away.", tags: ["High return", "High risk"], link: "https://dsebd.org" },
  { id: "gold", name: "Gold", bn: "সোনা", icon: "🪙", min: 50000, max: null, risk: ["medium"], rate: 12, rateLabel: "10–15%", liquidity: "High", horizon: "3–10 years", taxNote: "VAT on purchase", blurb: "Classic inflation hedge that holds value across currency swings. Buy hallmarked.", why: "When the taka weakens or inflation bites, gold holds purchasing power. A stabiliser.", tags: ["Inflation hedge", "Liquid"], link: null },
  { id: "realestate", name: "Land / Real Estate", bn: "জমি / ফ্ল্যাট", icon: "🏠", min: 1000000, max: null, risk: ["medium", "high"], rate: 15, rateLabel: "10–20% p.a.", liquidity: "Very Low", horizon: "5–20 years", taxNote: "Registration + gain tax", blurb: "Peri-urban Dhaka land has historically appreciated strongly. Large ticket, illiquid.", why: "Long-horizon inflation hedge if you have large capital you won't touch for years.", tags: ["Inflation hedge", "High ticket"], link: null },
  { id: "startup", name: "Startup / Angel", bn: "স্টার্টআপ", icon: "💡", min: 1000000, max: null, risk: ["high"], rate: 30, rateLabel: "0–100x", liquidity: "Very Low", horizon: "5–10 years", taxNote: "Varies", blurb: "Back early-stage BD companies. Most fail; a few return many times over.", why: "Highest upside and risk here. Only a small slice of capital you can fully afford to lose.", tags: ["Huge upside", "Mostly fail"], link: null },
];

/* ---------------- SAVINGS PRODUCTS ---------------- */
// rate = approx annual %, used to project maturity value
const SAVINGS = [
  { id: "bkash", name: "bKash DPS", bn: "বিকাশ ডিপিএস", icon: "📱", channel: "Mobile (bKash app)", min: 500, rate: 9.5, rateLabel: "8.5–10%", terms: "1–4 years", partners: "IDLC, BRAC, Dhaka Bank, MTB, City Bank", blurb: "Open a DPS from your phone in minutes — no paperwork, no branch visit. Auto-deducts monthly. Free cash-out at maturity.", best: "Best if you want zero friction and already use bKash daily.", islamic: true, tags: ["No paperwork", "Auto-deduct", "Islamic option"], link: "https://www.bkash.com/products-services/savings/monthly-dps" },
  { id: "bank_mss", name: "Bank Monthly Scheme (MSS)", bn: "ব্যাংক মাসিক স্কিম", icon: "🏦", channel: "Bank branch / app", min: 500, rate: 10.5, rateLabel: "9–12.5%", terms: "1–10 years", partners: "AB Bank, ONE Bank, National Bank, Dhaka Bank", blurb: "Traditional bank monthly savings scheme. Highest DPS rates available, longer terms, can borrow against it.", best: "Best for the highest rate and long-term goals like a house or child's education.", islamic: true, tags: ["Highest rate", "Long terms", "Loan facility"], link: null },
  { id: "dbbl", name: "DBBL / Islamic DPS", bn: "ইসলামিক ডিপিএস", icon: "🕌", channel: "Bank / Rocket app", min: 500, rate: 8.5, rateLabel: "8–9%", terms: "3–10 years", partners: "DBBL, Islami Bank, SIBL", blurb: "Shariah-compliant profit-sharing savings (Mudaraba). No fixed interest — returns based on bank profit.", best: "Best if you want a faith-aligned, riba-free way to save regularly.", islamic: true, tags: ["Shariah-compliant", "Profit-sharing"], link: null },
  { id: "nagad", name: "Nagad Savings", bn: "নগদ সেভিংস", icon: "📲", channel: "Mobile (Nagad app)", min: 500, rate: 9, rateLabel: "8.5–9.5%", terms: "1–3 years", partners: "Partner banks via Nagad", blurb: "Digital DPS through the Nagad app, similar to bKash. Quick mobile setup, auto-deduct.", best: "Best if Nagad is your primary mobile wallet.", islamic: false, tags: ["Mobile-first", "Auto-deduct"], link: null },
  { id: "postal", name: "Postal Savings", bn: "পোস্টাল সেভিংস", icon: "📮", channel: "Post office", min: 100, rate: 11.8, rateLabel: "~11.8%", terms: "3 years", partners: "Bangladesh Post Office", blurb: "Government postal savings, mirrors the 3-month Sanchayapatra rate. Very safe, widely accessible.", best: "Best for rural access and government-grade safety with a high rate.", islamic: false, tags: ["Govt-backed", "High rate", "Rural access"], link: null },
];

const RISK = {
  low: { label: "Conservative", color: "#2f7a4d", bg: "#e9f6ee", desc: "Protect my capital" },
  medium: { label: "Balanced", color: "#b7791f", bg: "#fdf4e3", desc: "Growth with some safety" },
  high: { label: "Aggressive", color: "#c0392b", bg: "#fdeceb", desc: "Maximize my returns" },
};

const ALLOCATION = {
  low: [ { cat: "Sanchayapatra", pct: 45, color: "#1a3a5c" }, { cat: "FDR / DPS", pct: 30, color: "#2d6a4f" }, { cat: "iFarmer", pct: 15, color: "#b7791f" }, { cat: "Gold", pct: 10, color: "#caa53d" } ],
  medium: [ { cat: "Sanchayapatra / Bonds", pct: 30, color: "#1a3a5c" }, { cat: "Mutual Funds", pct: 25, color: "#6b3fa0" }, { cat: "Blue-Chip Shares", pct: 25, color: "#2d6a4f" }, { cat: "iFarmer / Gold", pct: 20, color: "#b7791f" } ],
  high: [ { cat: "Growth Stocks", pct: 40, color: "#c0392b" }, { cat: "Blue-Chip Shares", pct: 30, color: "#2d6a4f" }, { cat: "Mutual Funds", pct: 20, color: "#6b3fa0" }, { cat: "Safe (Bonds/FDR)", pct: 10, color: "#1a3a5c" } ],
};

function fmt(n) {
  if (!n) return "৳0";
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} Lakh`;
  if (n >= 1000) return `৳${Math.round(n / 1000)}K`;
  return `৳${Math.round(n)}`;
}
const fmtFull = n => "৳" + Number(Math.round(n)).toLocaleString("en-IN");

/* ---------- Logo ---------- */
function Logo({ size = 30 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect x="9" y="30" width="6" height="9" rx="1.5" fill="#1e3a6e" />
        <rect x="18" y="22" width="6" height="17" rx="1.5" fill="#2d5ba8" />
        <rect x="27" y="14" width="6" height="25" rx="1.5" fill="#4f9eff" />
        <path d="M34 13 L37.5 7 L41 13" stroke="#4f9eff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M37.5 7 L37.5 20" stroke="#4f9eff" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
      <div style={{ fontWeight: 800, fontSize: size * 0.5, letterSpacing: "-0.03em", lineHeight: 1 }}>
        <span style={{ color: "#4f9eff" }}>Fin</span><span style={{ color: "#fff" }}>Desh</span>
        <span style={{ fontSize: size * 0.26, color: "#4f9eff", background: "rgba(79,158,255,0.15)", border: "1px solid rgba(79,158,255,0.3)", borderRadius: 4, padding: "1px 4px", marginLeft: 4, verticalAlign: "middle", fontWeight: 700 }}>AI</span>
      </div>
    </div>
  );
}

/* ---------- Donut ---------- */
function Donut({ data, amount }) {
  let cum = 0; const r = 60, stroke = 26, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <g transform="rotate(-90 80 80)">
          {data.map((d, i) => {
            const dash = (d.pct / 100) * circ, off = (cum / 100) * circ; cum += d.pct;
            return <circle key={i} cx="80" cy="80" r={r} fill="none" stroke={d.color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-off} />;
          })}
        </g>
        <text x="80" y="74" textAnchor="middle" fontSize="11" fill="#888" fontWeight="600">TOTAL</text>
        <text x="80" y="92" textAnchor="middle" fontSize="15" fill="#0a1628" fontWeight="800">{fmt(amount)}</text>
      </svg>
      <div style={{ flex: 1, minWidth: 180 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#333", flex: 1 }}>{d.cat}</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{d.pct}%</span>
            <span style={{ fontSize: 12, color: "#888", minWidth: 60, textAlign: "right" }}>{fmt(amount * d.pct / 100)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Invest card ---------- */
function InvestCard({ inst, amount }) {
  const [open, setOpen] = useState(false);
  const r = RISK[inst.risk[0]];
  const projected = amount * inst.rate / 100;
  const real = (inst.rate - INFLATION).toFixed(1);
  return (
    <div onClick={() => setOpen(o => !o)} style={{ background: "#fff", border: "1px solid #eaecef", borderLeft: `4px solid ${r.color}`, borderRadius: 12, padding: "16px 18px", cursor: "pointer", boxShadow: open ? "0 8px 28px rgba(10,22,40,0.10)" : "0 1px 3px rgba(10,22,40,0.04)" }}>
      <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>{inst.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{inst.name}</span>
            <span style={{ fontSize: 12, color: "#999" }}>{inst.bn}</span>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: r.color }}>{inst.rateLabel}</span>
            <span style={{ fontSize: 12.5, color: "#777" }}>⏱ {inst.horizon}</span>
            <span style={{ fontSize: 12.5, color: "#777" }}>💧 {inst.liquidity}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: "#999" }}>~1yr est.</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#2f7a4d" }}>+{fmt(projected)}</div>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f1f3" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13.5, lineHeight: 1.6, color: "#333" }}>{inst.blurb}</p>
          <div style={{ background: "#f7faff", border: "1px solid #e6eefb", borderRadius: 8, padding: "10px 12px", margin: "10px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4f9eff", letterSpacing: ".04em", marginBottom: 4 }}>WHY THIS FITS YOU</div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#2c4a6e" }}>{inst.why}</p>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {inst.tags.map(t => <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: r.bg, color: r.color }}>{t}</span>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12.5, color: "#555" }}>
            <span>💵 Min: <b>{fmt(inst.min)}</b></span>
            <span>📉 Real: <b style={{ color: real > 0 ? "#2f7a4d" : "#c0392b" }}>{real > 0 ? "+" : ""}{real}%</b> after inflation</span>
            <span>🧾 {inst.taxNote}</span>
          </div>
          {inst.link && <a href={inst.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-block", marginTop: 11, fontSize: 13, color: r.color, fontWeight: 700, textDecoration: "none" }}>Learn more →</a>}
        </div>
      )}
    </div>
  );
}

/* ---------- Savings card ---------- */
function SavingsCard({ s, monthly, months }) {
  const [open, setOpen] = useState(false);
  // future value of an ordinary annuity, monthly compounding
  const i = s.rate / 100 / 12;
  const fv = monthly * ((Math.pow(1 + i, months) - 1) / i);
  const deposited = monthly * months;
  const profit = fv - deposited;
  return (
    <div onClick={() => setOpen(o => !o)} style={{ background: "#fff", border: "1px solid #eaecef", borderLeft: "4px solid #1a56db", borderRadius: 12, padding: "16px 18px", cursor: "pointer", boxShadow: open ? "0 8px 28px rgba(10,22,40,0.10)" : "0 1px 3px rgba(10,22,40,0.04)" }}>
      <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: "#e8f0ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>{s.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</span>
            <span style={{ fontSize: 12, color: "#999" }}>{s.bn}</span>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1a56db" }}>{s.rateLabel}</span>
            <span style={{ fontSize: 12.5, color: "#777" }}>📲 {s.channel}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: "#999" }}>at maturity</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#2f7a4d" }}>{fmt(fv)}</div>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f1f3" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13.5, lineHeight: 1.6, color: "#333" }}>{s.blurb}</p>
          {/* projection bar */}
          <div style={{ background: "#f7faff", border: "1px solid #e6eefb", borderRadius: 8, padding: "12px", margin: "10px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
              <span style={{ color: "#5a6b85" }}>You deposit</span><b>{fmtFull(deposited)}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
              <span style={{ color: "#5a6b85" }}>Profit earned</span><b style={{ color: "#2f7a4d" }}>+{fmtFull(profit)}</b>
            </div>
            <div style={{ height: 1, background: "#e6eefb", margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ fontWeight: 700 }}>At maturity</span><b style={{ color: "#1a56db", fontSize: 15 }}>{fmtFull(fv)}</b>
            </div>
          </div>
          <div style={{ background: "#fff8ef", border: "1px solid #fbe6c8", borderRadius: 8, padding: "9px 12px", marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, color: "#92591a" }}>💡 {s.best}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {s.tags.map(t => <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: "#e8f0ff", color: "#1a56db" }}>{t}</span>)}
          </div>
          <div style={{ fontSize: 12.5, color: "#555", lineHeight: 1.6 }}>
            <div>🏦 Via: <b>{s.partners}</b></div>
            <div>📅 Terms: <b>{s.terms}</b> · Min: <b>{fmt(s.min)}/mo</b></div>
          </div>
          {s.link && <a href={s.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-block", marginTop: 11, fontSize: 13, color: "#1a56db", fontWeight: 700, textDecoration: "none" }}>How to open →</a>}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   INVEST PAGE
   ============================================================ */
function InvestPage() {
  const [amount, setAmount] = useState("");
  const [risk, setRisk] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef(null);
  const num = Number(String(amount).replace(/[^0-9]/g, ""));

  const run = () => {
    if (!num || num < 500) return setErr("Please enter at least ৳500.");
    if (!risk) return setErr("Please choose your risk level.");
    setErr(""); setSubmitted(true);
    setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };
  const matched = submitted && risk ? INSTRUMENTS.filter(i => i.risk.includes(risk) && i.min <= num).sort((a, b) => a.rate - b.rate) : [];
  const quick = [50000, 100000, 500000, 1000000];

  return (
    <>
      {!submitted && (
        <div style={{ textAlign: "center", padding: "36px 0 24px" }}>
          <div style={pill}>🇧🇩 Bangladesh's First AI Personal Finance Platform</div>
          <h1 style={h1}>You've earned it.<br />Now make it <span style={{ color: "#4f9eff" }}>grow</span>.</h1>
          <p style={sub}>Tell us how much you have and your risk comfort. Get a clear, Bangladesh-specific investment plan in seconds.</p>
        </div>
      )}

      <div style={card}>
        <label style={lbl}>How much do you have to invest?</label>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={taka}>৳</span>
          <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))} onKeyDown={e => e.key === "Enter" && run()} inputMode="numeric" placeholder="1,00,000" style={bigInput} />
          {num > 0 && <span style={inputHint}>{fmt(num)}</span>}
        </div>
        <div style={{ display: "flex", gap: 7, marginBottom: 22, flexWrap: "wrap" }}>
          {quick.map(q => <button key={q} onClick={() => setAmount(String(q))} style={chip(num === q)}>{fmt(q)}</button>)}
        </div>
        <label style={lbl}>What's your risk comfort?</label>
        <div style={{ display: "flex", gap: 9, marginBottom: 22 }}>
          {Object.entries(RISK).map(([k, c]) => (
            <button key={k} onClick={() => setRisk(k)} style={riskBtn(risk === k, c)}>
              <div style={{ fontSize: 14, fontWeight: 800, color: risk === k ? c.color : "#0a1628" }}>{c.label}</div>
              <div style={{ fontSize: 11.5, color: risk === k ? c.color : "#8a97ad", marginTop: 3, fontWeight: 500 }}>{c.desc}</div>
            </button>
          ))}
        </div>
        {err && <p style={errStyle}>{err}</p>}
        <button onClick={run} style={cta}>{submitted ? "Update my plan →" : "Get my plan →"}</button>
      </div>

      {submitted && (
        <div ref={ref} style={{ marginTop: 28 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 22px", marginBottom: 22, border: "1px solid #edf1f7" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800 }}>Suggested allocation</h3>
            <Donut data={ALLOCATION[risk]} amount={num} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 13, alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{matched.length} options for you</h3>
            <span style={{ fontSize: 12.5, color: "#8a97ad" }}>Low → high risk · tap for detail</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {matched.map(i => <InvestCard key={i.id} inst={i} amount={num} />)}
          </div>
          <div style={inflationNote}>💡 BD inflation is ~{INFLATION}%. Anything returning less is quietly losing you purchasing power — which is why a savings account (3–5%) hurts.</div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   SAVINGS PLANNER PAGE
   ============================================================ */
function SavingsPage() {
  const [mode, setMode] = useState("monthly"); // "monthly" = I can save X/mo  |  "goal" = I need X by date
  const [monthly, setMonthly] = useState("");
  const [goal, setGoal] = useState("");
  const [years, setYears] = useState(3);
  const [islamicOnly, setIslamicOnly] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef(null);

  const months = years * 12;
  const monthlyNum = Number(String(monthly).replace(/[^0-9]/g, ""));
  const goalNum = Number(String(goal).replace(/[^0-9]/g, ""));

  // In goal mode, compute required monthly deposit at a ~9.5% blended rate
  const blended = 9.5 / 100 / 12;
  const requiredMonthly = goalNum ? goalNum * blended / (Math.pow(1 + blended, months) - 1) : 0;
  const effectiveMonthly = mode === "monthly" ? monthlyNum : requiredMonthly;

  const run = () => {
    if (mode === "monthly" && (!monthlyNum || monthlyNum < 250)) return setErr("Enter at least ৳250/month.");
    if (mode === "goal" && (!goalNum || goalNum < 10000)) return setErr("Enter a goal of at least ৳10,000.");
    setErr(""); setSubmitted(true);
    setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  let options = SAVINGS.filter(s => s.min <= effectiveMonthly || effectiveMonthly === 0);
  if (islamicOnly) options = options.filter(s => s.islamic);
  options = options.sort((a, b) => b.rate - a.rate);

  return (
    <>
      {!submitted && (
        <div style={{ textAlign: "center", padding: "36px 0 24px" }}>
          <div style={pill}>💰 Savings Planner</div>
          <h1 style={h1}>Build the habit.<br />Reach the <span style={{ color: "#4f9eff" }}>goal</span>.</h1>
          <p style={sub}>Tell us what you can save monthly — or what you're saving toward — and see exactly where to put it and what it'll grow to.</p>
        </div>
      )}

      <div style={card}>
        {/* mode toggle */}
        <div style={{ display: "flex", background: "#f0f4fb", borderRadius: 10, padding: 4, marginBottom: 20 }}>
          {[["monthly", "I can save monthly"], ["goal", "I have a goal"]].map(([k, label]) => (
            <button key={k} onClick={() => { setMode(k); setSubmitted(false); }} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 13.5, fontWeight: 700, background: mode === k ? "#fff" : "transparent", color: mode === k ? "#1a56db" : "#8a97ad", boxShadow: mode === k ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>{label}</button>
          ))}
        </div>

        {mode === "monthly" ? (
          <>
            <label style={lbl}>How much can you save each month?</label>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <span style={taka}>৳</span>
              <input value={monthly} onChange={e => setMonthly(e.target.value.replace(/[^0-9]/g, ""))} onKeyDown={e => e.key === "Enter" && run()} inputMode="numeric" placeholder="5,000" style={bigInput} />
              {monthlyNum > 0 && <span style={inputHint}>{fmt(monthlyNum)}/mo</span>}
            </div>
            <div style={{ display: "flex", gap: 7, marginBottom: 22, flexWrap: "wrap" }}>
              {[1000, 2000, 5000, 10000].map(q => <button key={q} onClick={() => setMonthly(String(q))} style={chip(monthlyNum === q)}>{fmt(q)}</button>)}
            </div>
          </>
        ) : (
          <>
            <label style={lbl}>How much do you want to save up?</label>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <span style={taka}>৳</span>
              <input value={goal} onChange={e => setGoal(e.target.value.replace(/[^0-9]/g, ""))} onKeyDown={e => e.key === "Enter" && run()} inputMode="numeric" placeholder="5,00,000" style={bigInput} />
              {goalNum > 0 && <span style={inputHint}>{fmt(goalNum)}</span>}
            </div>
            <div style={{ display: "flex", gap: 7, marginBottom: 22, flexWrap: "wrap" }}>
              {[["Hajj 🕋", 600000], ["Wedding 💍", 800000], ["Down payment 🏠", 2000000], ["Emergency fund 🛟", 300000]].map(([label, q]) => (
                <button key={q} onClick={() => setGoal(String(q))} style={{ ...chip(goalNum === q), flex: "1 1 45%", fontSize: 12 }}>{label}</button>
              ))}
            </div>
          </>
        )}

        <label style={lbl}>Over how long?</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {[1, 2, 3, 5, 10].map(y => (
            <button key={y} onClick={() => setYears(y)} style={{ ...chip(years === y), flex: 1 }}>{y} yr{y > 1 ? "s" : ""}</button>
          ))}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", marginBottom: 20 }}>
          <input type="checkbox" checked={islamicOnly} onChange={e => setIslamicOnly(e.target.checked)} style={{ width: 17, height: 17, accentColor: "#1a56db" }} />
          <span style={{ fontSize: 13.5, color: "#5a6b85", fontWeight: 500 }}>Show only Shariah-compliant (Islamic) options 🕌</span>
        </label>

        {err && <p style={errStyle}>{err}</p>}
        <button onClick={run} style={cta}>{submitted ? "Update plan →" : "Show me how →"}</button>
      </div>

      {submitted && (
        <div ref={ref} style={{ marginTop: 28 }}>
          {/* Goal-mode required-monthly callout */}
          {mode === "goal" && (
            <div style={{ background: "linear-gradient(135deg,#0f2747,#0a1628)", borderRadius: 16, padding: "22px", marginBottom: 22, color: "#dde8f7", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#4f9eff", fontWeight: 700, letterSpacing: ".04em", marginBottom: 8 }}>TO REACH {fmt(goalNum)} IN {years} YEAR{years > 1 ? "S" : ""}</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{fmtFull(requiredMonthly)}<span style={{ fontSize: 16, color: "#8fa8cc", fontWeight: 600 }}>/month</span></div>
              <div style={{ fontSize: 13, color: "#a9bdd9" }}>at a blended ~9.5% rate. Pick a plan below to lock it in.</div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 13, alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{options.length} ways to save {fmt(effectiveMonthly)}/mo</h3>
            <span style={{ fontSize: 12.5, color: "#8a97ad" }}>Highest rate first · tap for detail</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {options.map(s => <SavingsCard key={s.id} s={s} monthly={effectiveMonthly} months={months} />)}
          </div>

          <div style={inflationNote}>💡 A DPS auto-deducts on a fixed date each month — the single best trick for building a savings habit. Set it and forget it, like Ramit's automation principle.</div>

          {/* cross-sell to invest */}
          <div style={{ marginTop: 22, background: "linear-gradient(135deg,#e8f0ff,#f4f7fc)", borderRadius: 16, padding: "20px", textAlign: "center", border: "1px solid #d8e6ff" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15.5, fontWeight: 800 }}>Got a lump sum sitting idle too?</h3>
            <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#5a6b85" }}>Saving monthly is step one. If you also have a lump sum, the Invest tool shows where to put it.</p>
            <span style={{ fontSize: 13.5, color: "#1a56db", fontWeight: 700 }}>→ Switch to the Invest tab above</span>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   COMING-SOON PAGE (Loans, Blueprint)
   ============================================================ */
function SoonPage({ title, bn, icon, desc, features }) {
  return (
    <div style={{ textAlign: "center", padding: "50px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{title}</h1>
      <div style={{ fontSize: 15, color: "#999", marginBottom: 14 }}>{bn}</div>
      <span style={{ ...pill, display: "inline-block", marginBottom: 20 }}>Coming soon</span>
      <p style={{ ...sub, marginBottom: 28 }}>{desc}</p>
      <div style={{ maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {features.map((f, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #edf1f7", borderRadius: 12, padding: "14px 16px", textAlign: "left", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 20 }}>{f.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{f.t}</div>
              <div style={{ fontSize: 12.5, color: "#8a97ad" }}>{f.s}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   ROOT — navigation shell
   ============================================================ */
export default function App() {
  const [page, setPage] = useState("invest");
  const tabs = [
    { id: "invest", label: "Invest", icon: "📈" },
    { id: "save", label: "Save", icon: "💰" },
    { id: "borrow", label: "Borrow", icon: "🏦" },
    { id: "blueprint", label: "Blueprint", icon: "🗺️" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fc", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: "#0a1628" }}>
      <nav style={{ background: "#0a1628", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", position: "sticky", top: 0, zIndex: 50 }}>
        <Logo size={30} />
        <span style={{ color: "#6b84b0", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} /> Live BD rates · 2026
        </span>
      </nav>

      {/* Tab bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8edf5", position: "sticky", top: 60, zIndex: 40 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", padding: "0 8px" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setPage(t.id); window.scrollTo({ top: 0 }); }} style={{
              flex: 1, padding: "13px 4px 11px", border: "none", background: "none", cursor: "pointer",
              borderBottom: page === t.id ? "2.5px solid #1a56db" : "2.5px solid transparent",
              color: page === t.id ? "#1a56db" : "#8a97ad", fontWeight: page === t.id ? 700 : 500, fontSize: 13,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            }}>
              <span style={{ fontSize: 17 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 16px 80px" }}>
        {page === "invest" && <InvestPage />}
        {page === "save" && <SavingsPage />}
        {page === "borrow" && <SoonPage title="Borrow Smart" bn="স্মার্ট ঋণ" icon="🏦" desc="Compare personal, home, and car loans across BD banks. See real EMIs, total interest cost, and which lender actually fits your situation — before you sign anything." features={[{ icon: "📊", t: "EMI calculator", s: "See monthly payment & total cost upfront" }, { icon: "⚖️", t: "Bank-by-bank comparison", s: "Personal, home, car, SME loans side by side" }, { icon: "🚩", t: "Hidden-fee flags", s: "Processing fees, early-settlement charges exposed" }]} />}
        {page === "blueprint" && <SoonPage title="BD Money Blueprint" bn="মানি ব্লুপ্রিন্ট" icon="🗺️" desc="The full step-by-step system — automate your salary, build your emergency fund, then save and invest in the right order. Your personal finance playbook, built for Bangladesh." features={[{ icon: "1️⃣", t: "Salary system", s: "Auto-split every paycheck the moment it lands" }, { icon: "🛟", t: "Emergency fund first", s: "How much, where to park it, why it matters" }, { icon: "📈", t: "Then save & invest", s: "The right order to build real wealth" }]} />}
      </div>

      <style>{`* { -webkit-tap-highlight-color: transparent; }`}</style>
    </div>
  );
}

/* ---------- shared styles ---------- */
const pill = { fontSize: 12, fontWeight: 700, color: "#4f9eff", background: "#e8f0ff", border: "1px solid #d2e2ff", borderRadius: 20, padding: "5px 14px", marginBottom: 18, letterSpacing: ".02em", display: "inline-block" };
const h1 = { fontSize: "clamp(26px,6vw,40px)", fontWeight: 900, margin: "0 0 12px", lineHeight: 1.12, letterSpacing: "-0.03em" };
const sub = { fontSize: 15.5, color: "#5a6b85", margin: "0 auto", maxWidth: 470, lineHeight: 1.55 };
const card = { background: "#fff", borderRadius: 18, padding: "26px 22px", boxShadow: "0 6px 36px rgba(10,22,40,0.08)", border: "1px solid #edf1f7" };
const lbl = { display: "block", fontWeight: 700, fontSize: 12, letterSpacing: ".05em", color: "#5a6b85", marginBottom: 9, textTransform: "uppercase" };
const taka = { position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 22, color: "#9aa7bd", fontWeight: 600 };
const bigInput = { width: "100%", boxSizing: "border-box", padding: "16px 16px 16px 42px", fontSize: 24, fontWeight: 800, color: "#0a1628", border: "2px solid #e6ecf5", borderRadius: 12, outline: "none", background: "#fafcff" };
const inputHint = { position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: "#4f9eff" };
const errStyle = { color: "#c0392b", fontSize: 13, margin: "0 0 12px", fontWeight: 500 };
const cta = { width: "100%", padding: "16px", fontSize: 16, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg,#1a56db,#0a1628)", border: "none", borderRadius: 12, cursor: "pointer" };
const inflationNote = { marginTop: 18, background: "#fff7ed", border: "1px solid #fde4c8", borderRadius: 10, padding: "12px 14px", fontSize: 12.5, color: "#92591a", lineHeight: 1.5 };
function chip(active) { return { flex: 1, minWidth: 64, padding: "9px 6px", fontSize: 12.5, fontWeight: 600, border: `1px solid ${active ? "#4f9eff" : "#e6ecf5"}`, background: active ? "#e8f0ff" : "#fff", color: active ? "#1a56db" : "#5a6b85", borderRadius: 8, cursor: "pointer" }; }
function riskBtn(active, c) { return { flex: 1, padding: "14px 6px", borderRadius: 12, cursor: "pointer", textAlign: "center", border: active ? `2px solid ${c.color}` : "2px solid #e6ecf5", background: active ? c.bg : "#fff" }; }
