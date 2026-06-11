import { useState, useRef, useEffect } from "react";

/* ============================================================
   FinDesh AI v3 — Dark Premium ("Robinhood-class")
   Invest · Save · Borrow (soon) · Blueprint (soon)
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
const SAVINGS = [
  { id: "bkash", name: "bKash DPS", bn: "বিকাশ ডিপিএস", icon: "📱", channel: "Mobile (bKash app)", min: 500, rate: 9.5, rateLabel: "8.5–10%", terms: "1–4 years", partners: "IDLC, BRAC, Dhaka Bank, MTB, City Bank", blurb: "Open a DPS from your phone in minutes — no paperwork, no branch visit. Auto-deducts monthly. Free cash-out at maturity.", best: "Best if you want zero friction and already use bKash daily.", islamic: true, tags: ["No paperwork", "Auto-deduct", "Islamic option"], link: "https://www.bkash.com/products-services/savings/monthly-dps" },
  { id: "bank_mss", name: "Bank Monthly Scheme (MSS)", bn: "ব্যাংক মাসিক স্কিম", icon: "🏦", channel: "Bank branch / app", min: 500, rate: 10.5, rateLabel: "9–12.5%", terms: "1–10 years", partners: "AB Bank, ONE Bank, National Bank, Dhaka Bank", blurb: "Traditional bank monthly savings scheme. Highest DPS rates available, longer terms, can borrow against it.", best: "Best for the highest rate and long-term goals like a house or child's education.", islamic: true, tags: ["Highest rate", "Long terms", "Loan facility"], link: null },
  { id: "dbbl", name: "DBBL / Islamic DPS", bn: "ইসলামিক ডিপিএস", icon: "🕌", channel: "Bank / Rocket app", min: 500, rate: 8.5, rateLabel: "8–9%", terms: "3–10 years", partners: "DBBL, Islami Bank, SIBL", blurb: "Shariah-compliant profit-sharing savings (Mudaraba). No fixed interest — returns based on bank profit.", best: "Best if you want a faith-aligned, riba-free way to save regularly.", islamic: true, tags: ["Shariah-compliant", "Profit-sharing"], link: null },
  { id: "nagad", name: "Nagad Savings", bn: "নগদ সেভিংস", icon: "📲", channel: "Mobile (Nagad app)", min: 500, rate: 9, rateLabel: "8.5–9.5%", terms: "1–3 years", partners: "Partner banks via Nagad", blurb: "Digital DPS through the Nagad app, similar to bKash. Quick mobile setup, auto-deduct.", best: "Best if Nagad is your primary mobile wallet.", islamic: false, tags: ["Mobile-first", "Auto-deduct"], link: null },
  { id: "postal", name: "Postal Savings", bn: "পোস্টাল সেভিংস", icon: "📮", channel: "Post office", min: 100, rate: 11.8, rateLabel: "~11.8%", terms: "3 years", partners: "Bangladesh Post Office", blurb: "Government postal savings, mirrors the 3-month Sanchayapatra rate. Very safe, widely accessible.", best: "Best for rural access and government-grade safety with a high rate.", islamic: false, tags: ["Govt-backed", "High rate", "Rural access"], link: null },
];

/* ---------------- THEME ---------------- */
const T = {
  bg: "#04080F",
  text: "#EAF1FC",
  muted: "#8A9BB8",
  faint: "#5C6E8C",
  accent: "#4F9EFF",
  accentSoft: "rgba(79,158,255,0.12)",
  accentBorder: "rgba(79,158,255,0.28)",
  green: "#00D68F",
  border: "rgba(148,180,255,0.12)",
  borderSoft: "rgba(148,180,255,0.08)",
  glass: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
  glassFlat: "rgba(255,255,255,0.03)",
};

const RISK = {
  low: { label: "Conservative", color: "#00D68F", bg: "rgba(0,214,143,0.10)", border: "rgba(0,214,143,0.35)", desc: "Protect my capital" },
  medium: { label: "Balanced", color: "#FFB454", bg: "rgba(255,180,84,0.10)", border: "rgba(255,180,84,0.35)", desc: "Growth with some safety" },
  high: { label: "Aggressive", color: "#FF6B6B", bg: "rgba(255,107,107,0.10)", border: "rgba(255,107,107,0.35)", desc: "Maximize my returns" },
};

const ALLOCATION = {
  low: [{ cat: "Sanchayapatra", pct: 45, color: "#4F9EFF" }, { cat: "FDR / DPS", pct: 30, color: "#00D68F" }, { cat: "iFarmer", pct: 15, color: "#FFB454" }, { cat: "Gold", pct: 10, color: "#E8C766" }],
  medium: [{ cat: "Sanchayapatra / Bonds", pct: 30, color: "#4F9EFF" }, { cat: "Mutual Funds", pct: 25, color: "#B07CFF" }, { cat: "Blue-Chip Shares", pct: 25, color: "#00D68F" }, { cat: "iFarmer / Gold", pct: 20, color: "#FFB454" }],
  high: [{ cat: "Growth Stocks", pct: 40, color: "#FF6B6B" }, { cat: "Blue-Chip Shares", pct: 30, color: "#00D68F" }, { cat: "Mutual Funds", pct: 20, color: "#B07CFF" }, { cat: "Safe (Bonds/FDR)", pct: 10, color: "#4F9EFF" }],
};

function fmt(n) {
  if (!n) return "৳0";
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} Lakh`;
  if (n >= 1000) return `৳${Math.round(n / 1000)}K`;
  return `৳${Math.round(n)}`;
}
const fmtFull = n => "৳" + Number(Math.round(n)).toLocaleString("en-IN");

/* ---------- Global CSS ---------- */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
::selection { background: rgba(79,158,255,0.35); }
body { margin: 0; }
@keyframes fdUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fdIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fdOrbA { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-25px) scale(1.12); } }
@keyframes fdOrbB { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-35px,20px) scale(1.08); } }
@keyframes fdPulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,214,143,0.5); } 50% { opacity: .75; box-shadow: 0 0 0 5px rgba(0,214,143,0); } }
@keyframes fdSeg { from { opacity: 0; } to { opacity: 1; } }
@keyframes fdSpin { to { transform: rotate(360deg); } }
.fd-up { animation: fdUp .55s cubic-bezier(.21,.8,.35,1) both; }
.fd-up-1 { animation-delay: .06s; } .fd-up-2 { animation-delay: .12s; } .fd-up-3 { animation-delay: .18s; }
.fd-item { transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease, background .22s ease; }
.fd-item:hover { transform: translateY(-3px); border-color: rgba(79,158,255,0.35) !important; box-shadow: 0 14px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(79,158,255,0.1); }
.fd-cta { transition: transform .18s ease, box-shadow .18s ease, filter .18s ease; }
.fd-cta:hover { filter: brightness(1.12); transform: translateY(-2px); box-shadow: 0 12px 36px rgba(79,158,255,0.42); }
.fd-cta:active { transform: translateY(0) scale(.985); }
.fd-chip { transition: border-color .15s ease, background .15s ease, color .15s ease, transform .15s ease; }
.fd-chip:hover { border-color: rgba(79,158,255,0.5) !important; color: #EAF1FC !important; transform: translateY(-1px); }
.fd-input { transition: border-color .2s ease, box-shadow .2s ease; }
.fd-input:focus { border-color: rgba(79,158,255,0.65) !important; box-shadow: 0 0 0 4px rgba(79,158,255,0.14); }
.fd-input::placeholder { color: #3D4D68; }
.fd-tab { transition: color .18s ease, background .18s ease; }
.fd-tab:hover { color: #C9D8F0 !important; }
.fd-link { transition: opacity .15s ease; }
.fd-link:hover { opacity: .75; }
.fd-risk { transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease; }
.fd-risk:hover { transform: translateY(-2px); border-color: rgba(148,180,255,0.35) !important; }
.fd-donut-seg { animation: fdSeg .8s ease both; }
.fd-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(79,158,255,0.25); border-top-color: #4F9EFF; animation: fdSpin .75s linear infinite; display: inline-block; flex-shrink: 0; }
::-webkit-scrollbar { width: 10px; } ::-webkit-scrollbar-track { background: #04080F; }
::-webkit-scrollbar-thumb { background: #1B2B45; border-radius: 6px; }
@media (prefers-reduced-motion: reduce) { .fd-up, .fd-donut-seg { animation: none; } }
`;

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

/* ---------- Ambient orbs ---------- */
function Orbs() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{ position: "absolute", top: -180, left: "-12%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,158,255,0.16), transparent 65%)", filter: "blur(50px)", animation: "fdOrbA 14s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: 120, right: "-15%", width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,214,143,0.10), transparent 65%)", filter: "blur(60px)", animation: "fdOrbB 18s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: -220, left: "30%", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(176,124,255,0.08), transparent 65%)", filter: "blur(70px)", animation: "fdOrbA 22s ease-in-out infinite" }} />
    </div>
  );
}

/* ---------- Animated counter ---------- */
function Counter({ value, format = fmtFull, duration = 800, style }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  useEffect(() => {
    let raf; const from = display, to = value;
    const step = ts => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    startRef.current = null;
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]); // eslint-disable-line
  return <span style={style}>{format(display)}</span>;
}

/* ---------- Donut ---------- */
function Donut({ data, amount }) {
  let cum = 0; const r = 60, stroke = 22, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width="172" height="172" viewBox="0 0 160 160" style={{ filter: "drop-shadow(0 0 24px rgba(79,158,255,0.18))" }}>
          <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(148,180,255,0.07)" strokeWidth={stroke} />
          <g transform="rotate(-90 80 80)">
            {data.map((d, i) => {
              const dash = (d.pct / 100) * circ, off = (cum / 100) * circ; cum += d.pct;
              return <circle key={i} className="fd-donut-seg" style={{ animationDelay: `${i * 0.12}s` }} cx="80" cy="80" r={r} fill="none" stroke={d.color} strokeWidth={stroke} strokeLinecap="butt" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-off} />;
            })}
          </g>
          <text x="80" y="73" textAnchor="middle" fontSize="10" fill={T.faint} fontWeight="700" letterSpacing="1.5">TOTAL</text>
          <text x="80" y="93" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="800">{fmt(amount)}</text>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        {data.map((d, i) => (
          <div key={i} className={`fd-up fd-up-${Math.min(i, 3)}`} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0", borderBottom: i < data.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0, boxShadow: `0 0 10px ${d.color}55` }} />
            <span style={{ fontSize: 13.5, color: "#C9D8F0", flex: 1, fontWeight: 500 }}>{d.cat}</span>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: "#fff" }}>{d.pct}%</span>
            <span style={{ fontSize: 12.5, color: T.muted, minWidth: 64, textAlign: "right", fontWeight: 600 }}>{fmt(amount * d.pct / 100)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Shared sub-components ---------- */
function Tag({ children, color = T.accent, bg = T.accentSoft }) {
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 11px", borderRadius: 20, background: bg, color, border: `1px solid ${color}33`, letterSpacing: ".01em" }}>{children}</span>;
}
function MetaPill({ children }) {
  return <span style={{ fontSize: 12, color: T.muted, fontWeight: 500, background: "rgba(148,180,255,0.06)", border: `1px solid ${T.borderSoft}`, borderRadius: 7, padding: "3px 9px" }}>{children}</span>;
}

/* ---------- Gemini AI ---------- */
async function fetchGeminiAdvice(amount, riskKey, topInstruments) {
  const key = import.meta.env.VITE_GEMINI_KEY;
  if (!key) return "";
  const riskLabel = RISK[riskKey]?.label || riskKey;
  const names = topInstruments.slice(0, 3).map(i => i.name).join(", ");
  const prompt = `You are FinDesh AI, Bangladesh's first AI-powered personal finance advisor. A user has ৳${Number(amount).toLocaleString("en-IN")} to invest with a ${riskLabel} risk profile. Their top matched instruments are: ${names}. Write exactly 2 sentences of warm, specific, actionable advice for a Bangladeshi investor. Mention BD's 8.5% inflation if relevant. No bullet points. No headers.`;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 130, temperature: 0.75 } }) }
    );
    const d = await res.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  } catch { return ""; }
}

function AIAdviceBox({ text, loading }) {
  if (!loading && !text) return null;
  return (
    <div className="fd-up" style={{ background: "linear-gradient(135deg, rgba(79,158,255,0.10), rgba(0,214,143,0.05))", border: "1px solid rgba(79,158,255,0.25)", borderRadius: 18, padding: "18px 20px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
        <span style={{ fontSize: 15 }}>✨</span>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: T.accent, letterSpacing: ".1em" }}>AI ADVICE FOR YOU</span>
      </div>
      {loading ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center", color: T.muted, fontSize: 13.5 }}>
          <span className="fd-spinner" />
          Generating your personalised advice…
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "#C9D8F0" }}>{text}</p>
      )}
    </div>
  );
}

/* ---------- Invest card ---------- */
function InvestCard({ inst, amount, idx }) {
  const [open, setOpen] = useState(false);
  const r = RISK[inst.risk[0]];
  const projected = amount * inst.rate / 100;
  const real = (inst.rate - INFLATION).toFixed(1);
  return (
    <div className={`fd-item fd-up fd-up-${Math.min(idx, 3)}`} onClick={() => setOpen(o => !o)} style={{ background: T.glass, border: `1px solid ${T.border}`, borderRadius: 18, padding: "18px 20px", cursor: "pointer", backdropFilter: "blur(16px)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: r.color, opacity: 0.85, boxShadow: `0 0 14px ${r.color}66` }} />
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: r.bg, border: `1px solid ${r.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{inst.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15.5, color: "#fff" }}>{inst.name}</span>
            <span style={{ fontSize: 12, color: T.faint }}>{inst.bn}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 7, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: r.color }}>{inst.rateLabel}</span>
            <MetaPill>⏱ {inst.horizon}</MetaPill>
            <MetaPill>💧 {inst.liquidity}</MetaPill>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 10.5, color: T.faint, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase" }}>~1yr est.</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.green }}>+{fmt(projected)}</div>
        </div>
      </div>
      {open && (
        <div className="fd-up" style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderSoft}` }}>
          <p style={{ margin: "0 0 10px", fontSize: 13.5, lineHeight: 1.65, color: "#B8C7E0" }}>{inst.blurb}</p>
          <div style={{ background: T.accentSoft, border: `1px solid ${T.accentBorder}`, borderRadius: 12, padding: "12px 14px", margin: "12px 0" }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: T.accent, letterSpacing: ".09em", marginBottom: 5 }}>WHY THIS FITS YOU</div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#C9D8F0" }}>{inst.why}</p>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 13 }}>
            {inst.tags.map(t => <Tag key={t} color={r.color} bg={r.bg}>{t}</Tag>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, fontSize: 12.5, color: T.muted }}>
            <span>💵 Min: <b style={{ color: "#EAF1FC" }}>{fmt(inst.min)}</b></span>
            <span>📉 Real: <b style={{ color: real > 0 ? T.green : "#FF6B6B" }}>{real > 0 ? "+" : ""}{real}%</b> after inflation</span>
            <span>🧾 {inst.taxNote}</span>
          </div>
          {inst.link && <a className="fd-link" href={inst.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-block", marginTop: 13, fontSize: 13, color: r.color, fontWeight: 700, textDecoration: "none" }}>Learn more →</a>}
        </div>
      )}
    </div>
  );
}

/* ---------- Savings card ---------- */
function SavingsCard({ s, monthly, months, idx }) {
  const [open, setOpen] = useState(false);
  const i = s.rate / 100 / 12;
  const fv = monthly * ((Math.pow(1 + i, months) - 1) / i);
  const deposited = monthly * months;
  const profit = fv - deposited;
  return (
    <div className={`fd-item fd-up fd-up-${Math.min(idx, 3)}`} onClick={() => setOpen(o => !o)} style={{ background: T.glass, border: `1px solid ${T.border}`, borderRadius: 18, padding: "18px 20px", cursor: "pointer", backdropFilter: "blur(16px)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: T.accent, opacity: 0.85, boxShadow: `0 0 14px ${T.accent}66` }} />
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: T.accentSoft, border: `1px solid ${T.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15.5, color: "#fff" }}>{s.name}</span>
            <span style={{ fontSize: 12, color: T.faint }}>{s.bn}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 7, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: T.accent }}>{s.rateLabel}</span>
            <MetaPill>📲 {s.channel}</MetaPill>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 10.5, color: T.faint, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase" }}>at maturity</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.green }}>{fmt(fv)}</div>
        </div>
      </div>
      {open && (
        <div className="fd-up" style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderSoft}` }}>
          <p style={{ margin: "0 0 10px", fontSize: 13.5, lineHeight: 1.65, color: "#B8C7E0" }}>{s.blurb}</p>
          <div style={{ background: "rgba(8,18,36,0.6)", border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px", margin: "12px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 7 }}>
              <span style={{ color: T.muted }}>You deposit</span><b style={{ color: "#EAF1FC" }}>{fmtFull(deposited)}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 7 }}>
              <span style={{ color: T.muted }}>Profit earned</span><b style={{ color: T.green }}>+{fmtFull(profit)}</b>
            </div>
            <div style={{ height: 1, background: T.borderSoft, margin: "9px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, alignItems: "baseline" }}>
              <span style={{ fontWeight: 700, color: "#fff" }}>At maturity</span><b style={{ color: T.accent, fontSize: 16 }}>{fmtFull(fv)}</b>
            </div>
          </div>
          <div style={{ background: "rgba(255,180,84,0.08)", border: "1px solid rgba(255,180,84,0.25)", borderRadius: 12, padding: "10px 13px", marginBottom: 12 }}>
            <span style={{ fontSize: 12.5, color: "#FFCE8A" }}>💡 {s.best}</span>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 11 }}>
            {s.tags.map(t => <Tag key={t}>{t}</Tag>)}
          </div>
          <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.7 }}>
            <div>🏦 Via: <b style={{ color: "#C9D8F0" }}>{s.partners}</b></div>
            <div>📅 Terms: <b style={{ color: "#C9D8F0" }}>{s.terms}</b> · Min: <b style={{ color: "#C9D8F0" }}>{fmt(s.min)}/mo</b></div>
          </div>
          {s.link && <a className="fd-link" href={s.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-block", marginTop: 13, fontSize: 13, color: T.accent, fontWeight: 700, textDecoration: "none" }}>How to open →</a>}
        </div>
      )}
    </div>
  );
}

/* ---------- Stats strip ---------- */
function StatStrip() {
  const stats = [
    { v: "11.93%", l: "Top govt-backed rate" },
    { v: "৳500", l: "Minimum to start" },
    { v: "16+", l: "BD instruments tracked" },
  ];
  return (
    <div className="fd-up fd-up-2" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", margin: "26px 0 6px" }}>
      {stats.map((s, i) => (
        <div key={i} style={{ flex: "1 1 130px", maxWidth: 200, textAlign: "center", padding: "14px 10px", background: T.glassFlat, border: `1px solid ${T.borderSoft}`, borderRadius: 14, backdropFilter: "blur(12px)" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>{s.v}</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3, fontWeight: 500 }}>{s.l}</div>
        </div>
      ))}
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
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const ref = useRef(null);
  const num = Number(String(amount).replace(/[^0-9]/g, ""));

  const matched = submitted && risk
    ? INSTRUMENTS.filter(i => i.risk.includes(risk) && i.min <= num).sort((a, b) => a.rate - b.rate)
    : [];

  const run = () => {
    if (!num || num < 500) return setErr("Please enter at least ৳500.");
    if (!risk) return setErr("Please choose your risk level.");
    setErr(""); setSubmitted(true);
    // Fire Gemini
    setAiText(""); setAiLoading(true);
    const topMatched = INSTRUMENTS.filter(i => i.risk.includes(risk) && i.min <= num).sort((a, b) => a.rate - b.rate);
    fetchGeminiAdvice(num, risk, topMatched).then(t => { setAiText(t); setAiLoading(false); });
    setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const quick = [50000, 100000, 500000, 1000000];

  return (
    <>
      {!submitted && (
        <div style={{ textAlign: "center", padding: "52px 0 26px" }}>
          <div className="fd-up" style={pill}>🇧🇩 Bangladesh's First AI Personal Finance Platform</div>
          <h1 className="fd-up fd-up-1" style={h1}>You've earned it.<br />Now make it <span style={gradText}>grow</span>.</h1>
          <p className="fd-up fd-up-2" style={sub}>Tell us how much you have and your risk comfort. Get a clear, Bangladesh-specific investment plan in seconds.</p>
          <StatStrip />
        </div>
      )}

      <div className="fd-up fd-up-3" style={card}>
        <label style={lbl}>How much do you have to invest?</label>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={taka}>৳</span>
          <input className="fd-input" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))} onKeyDown={e => e.key === "Enter" && run()} inputMode="numeric" placeholder="1,00,000" style={bigInput} />
          {num > 0 && <span style={inputHint}>{fmt(num)}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 26, flexWrap: "wrap" }}>
          {quick.map(q => <button key={q} className="fd-chip" onClick={() => setAmount(String(q))} style={chip(num === q)}>{fmt(q)}</button>)}
        </div>
        <label style={lbl}>What's your risk comfort?</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 26 }}>
          {Object.entries(RISK).map(([k, c]) => (
            <button key={k} className="fd-risk" onClick={() => setRisk(k)} style={riskBtn(risk === k, c)}>
              <div style={{ fontSize: 14, fontWeight: 800, color: risk === k ? c.color : "#EAF1FC" }}>{c.label}</div>
              <div style={{ fontSize: 11.5, color: risk === k ? c.color : T.muted, marginTop: 4, fontWeight: 500, opacity: risk === k ? 0.9 : 1 }}>{c.desc}</div>
            </button>
          ))}
        </div>
        {err && <p style={errStyle}>{err}</p>}
        <button className="fd-cta" onClick={run} style={cta}>{submitted ? "Update my plan →" : "Get my plan →"}</button>
      </div>

      {submitted && (
        <div ref={ref} style={{ marginTop: 30 }}>
          <AIAdviceBox text={aiText} loading={aiLoading} />

          <div className="fd-up" style={{ ...card, marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>Suggested allocation</h3>
            <Donut data={ALLOCATION[risk]} amount={num} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff" }}>{matched.length} options for you</h3>
            <span style={{ fontSize: 12.5, color: T.faint }}>Low → high risk · tap for detail</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {matched.map((i, idx) => <InvestCard key={i.id} inst={i} amount={num} idx={idx} />)}
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
  const [mode, setMode] = useState("monthly");
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
        <div style={{ textAlign: "center", padding: "52px 0 26px" }}>
          <div className="fd-up" style={pill}>💰 Savings Planner</div>
          <h1 className="fd-up fd-up-1" style={h1}>Build the habit.<br />Reach the <span style={gradText}>goal</span>.</h1>
          <p className="fd-up fd-up-2" style={sub}>Tell us what you can save monthly — or what you're saving toward — and see exactly where to put it and what it'll grow to.</p>
        </div>
      )}

      <div className="fd-up fd-up-3" style={card}>
        <div style={{ display: "flex", background: "rgba(8,18,36,0.7)", border: `1px solid ${T.borderSoft}`, borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {[["monthly", "I can save monthly"], ["goal", "I have a goal"]].map(([k, label]) => (
            <button key={k} className="fd-tab" onClick={() => { setMode(k); setSubmitted(false); }} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 13.5, fontWeight: 700, fontFamily: "inherit", background: mode === k ? "linear-gradient(135deg, rgba(79,158,255,0.25), rgba(79,158,255,0.12))" : "transparent", color: mode === k ? "#fff" : T.muted, boxShadow: mode === k ? "inset 0 0 0 1px rgba(79,158,255,0.4)" : "none" }}>{label}</button>
          ))}
        </div>

        {mode === "monthly" ? (
          <>
            <label style={lbl}>How much can you save each month?</label>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <span style={taka}>৳</span>
              <input className="fd-input" value={monthly} onChange={e => setMonthly(e.target.value.replace(/[^0-9]/g, ""))} onKeyDown={e => e.key === "Enter" && run()} inputMode="numeric" placeholder="5,000" style={bigInput} />
              {monthlyNum > 0 && <span style={inputHint}>{fmt(monthlyNum)}/mo</span>}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 26, flexWrap: "wrap" }}>
              {[1000, 2000, 5000, 10000].map(q => <button key={q} className="fd-chip" onClick={() => setMonthly(String(q))} style={chip(monthlyNum === q)}>{fmt(q)}</button>)}
            </div>
          </>
        ) : (
          <>
            <label style={lbl}>How much do you want to save up?</label>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <span style={taka}>৳</span>
              <input className="fd-input" value={goal} onChange={e => setGoal(e.target.value.replace(/[^0-9]/g, ""))} onKeyDown={e => e.key === "Enter" && run()} inputMode="numeric" placeholder="5,00,000" style={bigInput} />
              {goalNum > 0 && <span style={inputHint}>{fmt(goalNum)}</span>}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 26, flexWrap: "wrap" }}>
              {[["Hajj 🕋", 600000], ["Wedding 💍", 800000], ["Down payment 🏠", 2000000], ["Emergency fund 🛟", 300000]].map(([label, q]) => (
                <button key={q} className="fd-chip" onClick={() => setGoal(String(q))} style={{ ...chip(goalNum === q), flex: "1 1 45%", fontSize: 12 }}>{label}</button>
              ))}
            </div>
          </>
        )}

        <label style={lbl}>Over how long?</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
          {[1, 2, 3, 5, 10].map(y => (
            <button key={y} className="fd-chip" onClick={() => setYears(y)} style={{ ...chip(years === y), flex: 1 }}>{y} yr{y > 1 ? "s" : ""}</button>
          ))}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 24 }}>
          <input type="checkbox" checked={islamicOnly} onChange={e => setIslamicOnly(e.target.checked)} style={{ width: 17, height: 17, accentColor: T.accent }} />
          <span style={{ fontSize: 13.5, color: T.muted, fontWeight: 500 }}>Show only Shariah-compliant (Islamic) options 🕌</span>
        </label>

        {err && <p style={errStyle}>{err}</p>}
        <button className="fd-cta" onClick={run} style={cta}>{submitted ? "Update plan →" : "Show me how →"}</button>
      </div>

      {submitted && (
        <div ref={ref} style={{ marginTop: 30 }}>
          {mode === "goal" && (
            <div className="fd-up" style={{ background: "linear-gradient(135deg, rgba(79,158,255,0.16), rgba(8,18,36,0.9))", border: `1px solid ${T.accentBorder}`, borderRadius: 20, padding: "26px 22px", marginBottom: 24, textAlign: "center", backdropFilter: "blur(16px)", boxShadow: "0 0 60px rgba(79,158,255,0.12)" }}>
              <div style={{ fontSize: 12, color: T.accent, fontWeight: 800, letterSpacing: ".08em", marginBottom: 10 }}>TO REACH {fmt(goalNum)} IN {years} YEAR{years > 1 ? "S" : ""}</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", marginBottom: 5, letterSpacing: "-0.02em" }}>
                <Counter value={requiredMonthly} /><span style={{ fontSize: 16, color: T.muted, fontWeight: 600 }}>/month</span>
              </div>
              <div style={{ fontSize: 13, color: T.muted }}>at a blended ~9.5% rate. Pick a plan below to lock it in.</div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff" }}>{options.length} ways to save {fmt(effectiveMonthly)}/mo</h3>
            <span style={{ fontSize: 12.5, color: T.faint }}>Highest rate first · tap for detail</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {options.map((s, idx) => <SavingsCard key={s.id} s={s} monthly={effectiveMonthly} months={months} idx={idx} />)}
          </div>

          <div style={inflationNote}>💡 A DPS auto-deducts on a fixed date each month — the single best trick for building a savings habit. Set it and forget it, like Ramit's automation principle.</div>

          <div className="fd-up" style={{ marginTop: 24, background: T.glass, borderRadius: 20, padding: "24px 20px", textAlign: "center", border: `1px solid ${T.border}`, backdropFilter: "blur(16px)" }}>
            <h3 style={{ margin: "0 0 7px", fontSize: 16, fontWeight: 800, color: "#fff" }}>Got a lump sum sitting idle too?</h3>
            <p style={{ margin: "0 0 15px", fontSize: 13.5, color: T.muted }}>Saving monthly is step one. If you also have a lump sum, the Invest tool shows where to put it.</p>
            <span style={{ fontSize: 13.5, color: T.accent, fontWeight: 700 }}>→ Switch to the Invest tab above</span>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   COMING-SOON PAGE
   ============================================================ */
function SoonPage({ title, bn, icon, desc, features }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0 40px" }}>
      <div className="fd-up" style={{ fontSize: 52, marginBottom: 18, filter: "drop-shadow(0 0 20px rgba(79,158,255,0.3))" }}>{icon}</div>
      <h1 className="fd-up fd-up-1" style={{ fontSize: 32, fontWeight: 900, margin: "0 0 5px", letterSpacing: "-0.03em", color: "#fff" }}>{title}</h1>
      <div className="fd-up fd-up-1" style={{ fontSize: 15, color: T.faint, marginBottom: 16 }}>{bn}</div>
      <span className="fd-up fd-up-2" style={{ ...pill, display: "inline-block", marginBottom: 22 }}>Coming soon</span>
      <p className="fd-up fd-up-2" style={{ ...sub, marginBottom: 32 }}>{desc}</p>
      <div style={{ maxWidth: 440, margin: "0 auto", display: "flex", flexDirection: "column", gap: 11 }}>
        {features.map((f, i) => (
          <div key={i} className={`fd-item fd-up fd-up-${Math.min(i + 1, 3)}`} style={{ background: T.glass, border: `1px solid ${T.border}`, borderRadius: 16, padding: "16px 18px", textAlign: "left", display: "flex", gap: 14, alignItems: "center", backdropFilter: "blur(14px)" }}>
            <span style={{ fontSize: 22 }}>{f.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{f.t}</div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>{f.s}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${T.borderSoft}`, marginTop: 60, padding: "32px 20px 40px", textAlign: "center", position: "relative", zIndex: 1 }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><Logo size={24} /></div>
      <p style={{ fontSize: 12, color: T.faint, maxWidth: 520, margin: "0 auto 12px", lineHeight: 1.7 }}>
        FinDesh AI provides educational information on Bangladeshi financial products, not licensed investment advice. Rates shown are indicative and change — always verify with the institution before investing.
      </p>
      <div style={{ fontSize: 12, color: T.faint, fontWeight: 500 }}>
        Built in Dhaka 🇧🇩 · <a className="fd-link" href="https://findeshai.com" style={{ color: T.accent, textDecoration: "none", fontWeight: 600 }}>findeshai.com</a> · © 2026 FinDesh AI
      </div>
    </footer>
  );
}

/* ============================================================
   ROOT
   ============================================================ */
export default function App() {
  const [page, setPage] = useState("invest");
  const tabs = [
    { id: "invest", label: "Invest", icon: "📈" },
    { id: "save", label: "Save", icon: "💰" },
    { id: "borrow", label: "Borrow", icon: "🏦", soon: true },
    { id: "blueprint", label: "Blueprint", icon: "🗺️", soon: true },
  ];

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 80% 50% at 50% -10%, #0B1E3D 0%, ${T.bg} 55%)`, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: T.text, position: "relative" }}>
      <style>{GLOBAL_CSS}</style>
      <Orbs />

      <nav style={{ background: "rgba(4,8,15,0.75)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", position: "sticky", top: 0, zIndex: 50, borderBottom: `1px solid ${T.borderSoft}` }}>
        <Logo size={30} />
        <span style={{ color: T.muted, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, animation: "fdPulse 2.2s ease-in-out infinite" }} /> Live BD rates · 2026
        </span>
      </nav>

      <div style={{ position: "sticky", top: 62, zIndex: 40, background: "rgba(4,8,15,0.7)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: `1px solid ${T.borderSoft}`, padding: "10px 12px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: 4 }}>
          {tabs.map(t => (
            <button key={t.id} className="fd-tab" onClick={() => { setPage(t.id); window.scrollTo({ top: 0 }); }} style={{
              flex: 1, padding: "9px 4px", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
              background: page === t.id ? "linear-gradient(135deg, rgba(79,158,255,0.28), rgba(79,158,255,0.12))" : "transparent",
              color: page === t.id ? "#fff" : T.muted, fontWeight: page === t.id ? 800 : 600, fontSize: 12.5,
              boxShadow: page === t.id ? "inset 0 0 0 1px rgba(79,158,255,0.45), 0 4px 16px rgba(79,158,255,0.15)" : "none",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2, position: "relative",
            }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span>{t.label}{t.soon && <span style={{ fontSize: 8, fontWeight: 800, color: "#FFB454", marginLeft: 4, verticalAlign: "super", letterSpacing: ".04em" }}>SOON</span>}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 16px 40px", position: "relative", zIndex: 1 }}>
        {page === "invest" && <InvestPage />}
        {page === "save" && <SavingsPage />}
        {page === "borrow" && <SoonPage title="Borrow Smart" bn="স্মার্ট ঋণ" icon="🏦" desc="Compare personal, home, and car loans across BD banks. See real EMIs, total interest cost, and which lender actually fits your situation — before you sign anything." features={[{ icon: "📊", t: "EMI calculator", s: "See monthly payment & total cost upfront" }, { icon: "⚖️", t: "Bank-by-bank comparison", s: "Personal, home, car, SME loans side by side" }, { icon: "🚩", t: "Hidden-fee flags", s: "Processing fees, early-settlement charges exposed" }]} />}
        {page === "blueprint" && <SoonPage title="BD Money Blueprint" bn="মানি ব্লুপ্রিন্ট" icon="🗺️" desc="The full step-by-step system — automate your salary, build your emergency fund, then save and invest in the right order. Your personal finance playbook, built for Bangladesh." features={[{ icon: "1️⃣", t: "Salary system", s: "Auto-split every paycheck the moment it lands" }, { icon: "🛟", t: "Emergency fund first", s: "How much, where to park it, why it matters" }, { icon: "📈", t: "Then save & invest", s: "The right order to build real wealth" }]} />}
      </div>

      <Footer />
    </div>
  );
}

/* ---------- shared styles ---------- */
const gradText = { background: "linear-gradient(95deg, #4F9EFF 10%, #8AC2FF 60%, #00D68F 110%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };
const pill = { fontSize: 12, fontWeight: 700, color: "#8AC2FF", background: "rgba(79,158,255,0.10)", border: "1px solid rgba(79,158,255,0.30)", borderRadius: 20, padding: "6px 16px", marginBottom: 20, letterSpacing: ".02em", display: "inline-block", backdropFilter: "blur(10px)" };
const h1 = { fontSize: "clamp(30px,6.5vw,48px)", fontWeight: 900, margin: "0 0 14px", lineHeight: 1.08, letterSpacing: "-0.035em", color: "#fff" };
const sub = { fontSize: 16, color: "#8A9BB8", margin: "0 auto", maxWidth: 480, lineHeight: 1.6 };
const card = { background: T.glass, borderRadius: 22, padding: "28px 24px", border: `1px solid ${T.border}`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", position: "relative", zIndex: 1 };
const lbl = { display: "block", fontWeight: 700, fontSize: 11.5, letterSpacing: ".08em", color: "#8A9BB8", marginBottom: 10, textTransform: "uppercase" };
const taka = { position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", fontSize: 22, color: "#5C6E8C", fontWeight: 600 };
const bigInput = { width: "100%", boxSizing: "border-box", padding: "17px 16px 17px 44px", fontSize: 24, fontWeight: 800, color: "#fff", border: "1.5px solid rgba(148,180,255,0.18)", borderRadius: 14, outline: "none", background: "rgba(8,18,36,0.65)", fontFamily: "inherit", caretColor: "#4F9EFF" };
const inputHint = { position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: "#4F9EFF" };
const errStyle = { color: "#FF6B6B", fontSize: 13, margin: "0 0 14px", fontWeight: 600 };
const cta = { width: "100%", padding: "17px", fontSize: 16, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg, #4F9EFF, #2563EB)", border: "none", borderRadius: 14, cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em", boxShadow: "0 8px 28px rgba(79,158,255,0.3)" };
const inflationNote = { marginTop: 20, background: "rgba(255,180,84,0.07)", border: "1px solid rgba(255,180,84,0.22)", borderRadius: 13, padding: "13px 15px", fontSize: 12.5, color: "#FFCE8A", lineHeight: 1.6, position: "relative", zIndex: 1 };
function chip(active) { return { flex: 1, minWidth: 64, padding: "10px 6px", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", border: `1px solid ${active ? "rgba(79,158,255,0.6)" : "rgba(148,180,255,0.14)"}`, background: active ? "rgba(79,158,255,0.16)" : "rgba(255,255,255,0.025)", color: active ? "#8AC2FF" : "#8A9BB8", borderRadius: 10, cursor: "pointer" }; }
function riskBtn(active, c) { return { flex: 1, padding: "15px 6px", borderRadius: 14, cursor: "pointer", textAlign: "center", fontFamily: "inherit", border: active ? `1.5px solid ${c.border}` : "1.5px solid rgba(148,180,255,0.14)", background: active ? c.bg : "rgba(255,255,255,0.025)", boxShadow: active ? `0 0 24px ${c.color}22` : "none" }; }
