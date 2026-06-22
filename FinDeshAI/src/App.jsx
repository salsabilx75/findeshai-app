import { useState, useRef, useEffect, useMemo, createContext, useContext } from "react";

/* ============================================================
   FinDesh AI v4 — Dark Premium
   Invest · Save · Borrow · Blueprint — all four tabs live
   Rates researched & verified June 2026:
   - Sanchayapatra: Jan-2026 revised rates (≤৳7.5L tier)
   - Policy rate 10% · Inflation ~8.6% · DSEX ~5,483 (+14.8% YoY)
   - Gold 22k ~৳2.2 Lakh/bhori (+~28% YoY)
   - Excluded: Islami Bank + 5 merged S Alam banks (FSIB, SIBL,
     Union, Global Islami, Exim → "Sammilito"), BASIC, Padma
   ============================================================ */

const INFLATION = 8.6;          // point-to-point ~8.58% Jan 2026, 12-mo avg 8.66%
const POLICY_RATE = 10;         // BB repo, held Jan–Jun 2026
const LAST_UPDATED = "June 2026";

/* ---------------- INVEST INSTRUMENTS (verified Jun 2026) ---------------- */
const INSTRUMENTS = [
  { id: "sanchayapatra", name: "Sanchayapatra (5-Year)", bn: "সঞ্চয়পত্র", icon: "🏛️", min: 10000, max: 3000000, maxJoint: 6000000, joint: true, risk: ["low"], rate: 11.83, rateLabel: "11.83%", liquidity: "Low", horizon: "5 years", taxNote: "5–10% source tax · 11.80% above ৳7.5L", blurb: "Government-guaranteed, highest safe return in Bangladesh. Rate revised January 2026: 11.83% up to ৳7.5 Lakh, 11.80% above. Locked at purchase for the full term. Individual cap ৳30 Lakh, or ৳60 Lakh held jointly.", why: "Beats inflation comfortably with zero capital risk — the anchor of any conservative portfolio.", tags: ["Govt. guaranteed", "Beats inflation"], link: "https://nationalsavings.gov.bd" },
  { id: "pensioner", name: "Pensioner Sanchayapatra", bn: "পেনশনার সঞ্চয়পত্র", icon: "🧓", min: 50000, max: 5000000, maxJoint: null, joint: false, risk: ["low"], rate: 11.98, rateLabel: "11.98%", liquidity: "Low", horizon: "5 yrs (quarterly payout)", taxNote: "5–10% source tax · 11.80% above ৳7.5L", blurb: "The highest NSC rate in the country — for retired government/semi-government employees and their families. Quarterly profit payout. Minimum ৳50,000, individual cap ৳50 Lakh (single-name only).", why: "If you or a parent is a retired govt employee, nothing safe pays more in Bangladesh right now.", tags: ["Highest NSC rate", "Quarterly income"], link: "https://nationalsavings.gov.bd" },
  { id: "paribar", name: "Paribar Sanchayapatra", bn: "পরিবার সঞ্চয়পত্র", icon: "👨‍👩‍👧", min: 10000, max: 4500000, maxJoint: null, joint: false, risk: ["low"], rate: 11.93, rateLabel: "11.93%", liquidity: "Low", horizon: "5 yrs (monthly payout)", taxNote: "5–10% source tax · 11.80% above ৳7.5L", blurb: "Monthly profit payout. For women, seniors 65+, and the disabled. Rate revised January 2026. Individual cap ৳45 Lakh (single-name only).", why: "If you want regular monthly income rather than lump-sum growth, this pays out monthly at a top rate.", tags: ["Monthly income", "For women & 65+"], link: "https://nationalsavings.gov.bd" },
  { id: "sp3m", name: "3-Month Profit Sanchayapatra", bn: "৩ মাস অন্তর মুনাফা", icon: "🗓️", min: 100000, max: 3000000, maxJoint: 6000000, joint: true, risk: ["low"], rate: 11.82, rateLabel: "11.82%", liquidity: "Low", horizon: "3 yrs (quarterly payout)", taxNote: "5–10% source tax · 11.77% above ৳7.5L", blurb: "Three-year certificate paying profit every three months — shorter lock-in than the 5-year, nearly the same rate. Minimum ৳1 Lakh; individual cap ৳30 Lakh, or ৳60 Lakh held jointly.", why: "Want govt-guaranteed income without committing five years? This is the shortest NSC with a near-top rate.", tags: ["Shorter lock-in", "Quarterly income"], link: "https://nationalsavings.gov.bd" },
  { id: "wedb", name: "Wage Earner Dev. Bond", bn: "ওয়েজ আর্নার বন্ড", icon: "✈️", min: 25000, max: null, risk: ["low"], rate: 12, rateLabel: "9–12%", liquidity: "Low", horizon: "5 years", taxNote: "Fully tax-exempt", blurb: "For Bangladeshis earning abroad: buy in BDT against remittance. Tiered 12% down to 9% by amount — and completely tax-free.", why: "If you (or your spouse/parents on your behalf) earn abroad, this is the best tax-free safe return available.", tags: ["Remitters only", "Tax-free", "Up to 12%"], link: "https://www.bb.org.bd/en/index.php/investfacility/wedbond" },
  { id: "fdr", name: "Fixed Deposit (FDR)", bn: "ফিক্সড ডিপোজিট", icon: "🏦", min: 10000, max: null, risk: ["low"], rate: 10, rateLabel: "9–11.5%", liquidity: "Medium", horizon: "3 mo – 3 yrs", taxNote: "10–15% source tax", blurb: "Banks are competing hard for deposits with the policy rate at 10%. Strong banks (BRAC, EBL, DBBL, City, Prime, MTB) pay 9–11.5% on 1-year FDRs. Avoid weak banks chasing you with 12%+.", why: "More flexible tenure than Sanchayapatra. Good for money you may need within a few years — stick to well-capitalised banks.", tags: ["Flexible tenure", "Near-record rates"], link: null },
  { id: "ifarmer", name: "iFarmer (Agri Funding)", bn: "আইফার্মার", icon: "🌾", min: 40000, max: 1000000, risk: ["low", "medium"], rate: 12, rateLabel: "8–15%", liquidity: "Low", horizon: "3–9 months", taxNote: "TIN required", blurb: "Fund verified farm projects via profit-sharing with insurance backing. ⚠️ iFarmer now works mainly with institutional financiers — retail lots open intermittently, so confirm availability in their app before planning around it.", why: "Above any bank deposit on short cycles when lots are open, with insurance reducing downside. Start small.", tags: ["Short cycle", "Insured", "Check availability"], link: "https://ifarmer.asia" },
  { id: "tbond", name: "Treasury Bond / Bill", bn: "ট্রেজারি বন্ড", icon: "📜", min: 100000, max: null, risk: ["low", "medium"], rate: 10, rateLabel: "9.5–10.2%", liquidity: "Medium", horizon: "91 days – 20 yrs", taxNote: "Tax on coupon", blurb: "Government debt via any bank's treasury desk. Early 2026: 91-day bills ~9.5%, 10-year bonds ~10.2% — yields are drifting down as the govt borrows less from banks.", why: "Govt-backed like Sanchayapatra but tradeable — and locking a 10-yr bond now keeps today's rate if cuts continue.", tags: ["Govt. backed", "Tradeable"], link: "https://www.bb.org.bd/en/index.php/monetaryactivity/treasury" },
  { id: "mutualfund", name: "Mutual Fund", bn: "মিউচুয়াল ফান্ড", icon: "📊", min: 5000, max: null, risk: ["medium"], rate: 12, rateLabel: "8–18%", liquidity: "Medium", horizon: "2–5 years", taxNote: "Dividend mostly tax-exempt", blurb: "Professionally managed pooled funds on the DSE. Compare funds by weekly NAV (published on dsebd.org) — favour managers with 3+ years of NAV growth above the DSEX.", why: "A managed bridge into the market — diversified, lower-effort, tax-friendly dividends.", tags: ["Diversified", "Check weekly NAV"], link: "https://dsebd.org" },
  { id: "bluechip", name: "DSE Blue-Chip Shares", bn: "ব্লু-চিপ শেয়ার", icon: "📈", min: 25000, max: null, risk: ["medium", "high"], rate: 15, rateLabel: "12–25%", liquidity: "High", horizon: "1–5 years", taxNote: "No capital-gains tax", blurb: "Shares in DS30 leaders — Grameenphone, BRAC Bank, Square Pharma. DSEX is ~5,480, up ~14.8% over the last 12 months.", why: "Real ownership in BD's best companies, no CGT for individuals. Prices swing — invest for years.", tags: ["High liquidity", "No CGT"], link: "https://dsebd.org" },
  { id: "growth", name: "DSE Growth Stocks", bn: "গ্রোথ শেয়ার", icon: "🚀", min: 50000, max: null, risk: ["high"], rate: 25, rateLabel: "20–60%+", liquidity: "High", horizon: "6 mo – 3 yrs", taxNote: "No capital-gains tax", blurb: "Smaller high-growth listed firms. Big upside, real downside — DSE has boom/bust history.", why: "Where the largest returns live, and where people lose money. Only money you can lock away.", tags: ["High return", "High risk"], link: "https://dsebd.org" },
  { id: "gold", name: "Gold", bn: "সোনা", icon: "🪙", min: 50000, max: null, risk: ["medium"], rate: 13, rateLabel: "10–15% (long-run)", liquidity: "High", horizon: "3–10 years", taxNote: "VAT on purchase", blurb: "22k gold is ~৳2.2 Lakh/bhori (June 2026) — up roughly 28% in 12 months. Long-run returns are lower; don't chase last year's spike. Buy BAJUS-hallmarked only.", why: "When the taka weakens or inflation bites, gold holds purchasing power. A stabiliser, not a growth engine.", tags: ["Inflation hedge", "+28% last yr"], link: null },
  { id: "realestate", name: "Land / Real Estate", bn: "জমি / ফ্ল্যাট", icon: "🏠", min: 1000000, max: null, risk: ["medium", "high"], rate: 15, rateLabel: "10–20% p.a.", liquidity: "Very Low", horizon: "5–20 years", taxNote: "Registration + gain tax", blurb: "Peri-urban Dhaka land has historically appreciated strongly. Large ticket, illiquid.", why: "Long-horizon inflation hedge if you have large capital you won't touch for years.", tags: ["Inflation hedge", "High ticket"], link: null },
  { id: "startup", name: "Startup / Angel", bn: "স্টার্টআপ", icon: "💡", min: 1000000, max: null, risk: ["high"], rate: 30, rateLabel: "0–100x", liquidity: "Very Low", horizon: "5–10 years", taxNote: "Varies", blurb: "Back early-stage BD companies. Most fail; a few return many times over.", why: "Highest upside and risk here. Only a small slice of capital you can fully afford to lose.", tags: ["Huge upside", "Mostly fail"], link: null },
];

/* ---------------- SANCHAYAPATRA LIMITS (verified Jun 2026 ·
     National Savings Dept · individual vs joint caps & combined rule) ---------------- */
const SANCHAYAPATRA_LIMITS = [
  { id: "sanchayapatra", name: "5-Year Bangladesh", bn: "সঞ্চয়পত্র", min: 10000, indiv: 3000000, joint: 6000000 },
  { id: "sp3m", name: "3-Monthly Profit", bn: "৩ মাস অন্তর", min: 100000, indiv: 3000000, joint: 6000000 },
  { id: "paribar", name: "Poribar", bn: "পরিবার", min: 10000, indiv: 4500000, joint: null },
  { id: "pensioner", name: "Pensioner", bn: "পেনশনার", min: 50000, indiv: 5000000, joint: null },
];

/* ---------------- SAVINGS PRODUCTS (verified Jun 2026 · Nagad removed ·
     no Islami Bank / SIBL / S Alam-linked banks anywhere) ---------------- */
const SAVINGS = [
  { id: "onebank", name: "ONE Bank PENSAVE / EDUSAVE", bn: "ওয়ান ব্যাংক ডিপিএস", icon: "🏦", channel: "Branch / app", min: 500, rate: 11, rateLabel: "up to 11%", terms: "3–10 years", partners: "ONE Bank PLC", blurb: "Among the highest DPS rates from a stable bank right now — up to 11% on 5-year+ commitments. PENSAVE targets retirement, EDUSAVE a child's education.", best: "Best headline rate for long-term goals like retirement or education.", islamic: false, tags: ["Top rate", "Long terms", "Goal schemes"], link: "https://www.onebank.com.bd" },
  { id: "midland", name: "Midland Bank Digital DPS", bn: "মিডল্যান্ড ডিজিটাল ডিপিএস", icon: "💻", channel: "Fully online (app)", min: 500, rate: 10.5, rateLabel: "up to 10.5%", terms: "1–10 years", partners: "Midland Bank PLC", blurb: "Open entirely online through the Midland app — no branch visit — at one of the best digital DPS rates in the market.", best: "Best if you want a top rate AND fully-online opening.", islamic: false, tags: ["100% online", "High rate"], link: "https://www.midlandbankbd.net" },
  { id: "ebl", name: "EBL DPS (incl. Women's)", bn: "ইস্টার্ন ব্যাংক ডিপিএস", icon: "🏛️", channel: "Branch / Skybanking app", min: 500, rate: 10, rateLabel: "9.5–10.5%", terms: "3–10 years", partners: "Eastern Bank PLC", blurb: "EBL's Millionaire Scheme, Women's Confidence DPS and Secure DPS (with free life-insurance cover on instalments) from one of BD's best-rated private banks.", best: "Best blend of strong rate, strong bank, and extras like insurance cover.", islamic: false, tags: ["Insurance cover", "Women's scheme", "Strong bank"], link: "https://www.ebl.com.bd" },
  { id: "bkash", name: "bKash DPS", bn: "বিকাশ ডিপিএস", icon: "📱", channel: "Mobile (bKash app)", min: 500, rate: 9.5, rateLabel: "9–10%", terms: "6 mo – 4 years", partners: "BRAC Bank, IDLC Finance, Dhaka Bank, MTB, City Islamic", blurb: "Open a DPS from your phone in minutes — no paperwork. Auto-deducts monthly (weekly DPS from ৳250 too). Free cash-out at maturity. Islamic DPS via City Islamic & Dhaka Bank.", best: "Best if you want zero friction and already use bKash daily.", islamic: true, tags: ["No paperwork", "Auto-deduct", "Islamic option"], link: "https://www.bkash.com/en/products-services/savings/monthly-dps" },
  { id: "dbbl", name: "DBBL Deposit Plus (DPS)", bn: "ডাচ্-বাংলা ডিপিএস", icon: "🏧", channel: "Branch / Rocket / NexusPay", min: 500, rate: 9.5, rateLabel: "up to 9.5%", terms: "1–10 years", partners: "Dutch-Bangla Bank PLC", blurb: "Solid DPS from one of the country's most trusted, tech-forward banks — manage it from the biggest ATM/agent network in BD.", best: "Best for maximum stability and easy access everywhere in the country.", islamic: false, tags: ["Most trusted", "Huge network"], link: "https://www.dutchbanglabank.com" },
  { id: "islamicdps", name: "Islamic DPS — City Islamic / Dhaka Bank", bn: "ইসলামিক ডিপিএস", icon: "🕌", channel: "bKash app / branch", min: 500, rate: 9, rateLabel: "8.5–9.5% (profit)", terms: "1–5 years", partners: "City Islamic (City Bank), Dhaka Bank Islamic", blurb: "Shariah-compliant Mudaraba profit-sharing DPS from healthy, well-governed banks — no fixed interest; returns from actual bank profit. Open via bKash or branch.", best: "Best riba-free way to save regularly without touching troubled Islamic banks.", islamic: true, tags: ["Shariah-compliant", "Profit-sharing", "Safe banks"], link: "https://www.bkash.com/en/products-services/savings/islamic-dps" },
  { id: "postal", name: "Postal Savings", bn: "পোস্টাল সেভিংস", icon: "📮", channel: "Post office", min: 100, rate: 11.8, rateLabel: "~11.8%", terms: "3 years", partners: "Bangladesh Post Office", blurb: "Government postal savings, mirroring the 3-month Sanchayapatra rate (11.82% as of Jan 2026). Very safe, accessible even in rural areas, ৳100 minimum.", best: "Best for rural access and government-grade safety with a high rate.", islamic: false, tags: ["Govt-backed", "High rate", "৳100 min"], link: null },
];

/* ---------------- LENDERS (Borrow tab · verified ranges Jun 2026 ·
     indicative — banks price by profile; troubled banks excluded) ---------------- */
const LENDERS = [
  { id: "dbbl_l", name: "Dutch-Bangla Bank", icon: "🏧", islamic: false, fee: "0.5–1% processing", elig: "Salaried / professional, min. income ~৳30K/mo", note: "Consistently among the lowest rates and fees in the market.", link: "https://www.dutchbanglabank.com", products: { personal: { label: "11.5–13.5%", mid: 12.5, max: "up to ৳20 Lakh", tenure: "1–5 yrs" }, home: { label: "10–12%", mid: 11, max: "up to ৳2 Cr", tenure: "up to 25 yrs" }, car: { label: "11.5–13%", mid: 12.2, max: "50% of car value (BB cap)", tenure: "up to 6 yrs" } } },
  { id: "brac_l", name: "BRAC Bank", icon: "🏦", islamic: false, fee: "0.5–1% processing", elig: "Salaried, business owners & professionals; strong SME arm", note: "Fast processing, large retail loan book, special women-entrepreneur windows.", link: "https://www.bracbank.com", products: { personal: { label: "12–14%", mid: 13, max: "up to ৳20 Lakh", tenure: "1–5 yrs" }, home: { label: "11–13%", mid: 12, max: "up to ৳2 Cr", tenure: "up to 25 yrs" }, car: { label: "12–14%", mid: 13, max: "50% of car value", tenure: "up to 6 yrs" } } },
  { id: "ebl_l", name: "Eastern Bank (EBL)", icon: "🏛️", islamic: false, fee: "0.5–1% processing", elig: "Salaried / professional, min. income ~৳40K/mo", note: "Strong service quality; competitive home loan pricing.", link: "https://www.ebl.com.bd", products: { personal: { label: "12–14%", mid: 13, max: "up to ৳20 Lakh", tenure: "1–5 yrs" }, home: { label: "10.5–12.5%", mid: 11.5, max: "up to ৳2 Cr", tenure: "up to 25 yrs" }, car: { label: "12–13.5%", mid: 12.7, max: "50% of car value", tenure: "up to 6 yrs" } } },
  { id: "city_l", name: "City Bank", icon: "🌆", islamic: false, fee: "0.5–1% processing", elig: "Salaried / professional; Amex card holders get perks", note: "Big retail lender; also runs City Islamic for Shariah products.", link: "https://www.citybankplc.com", products: { personal: { label: "12–14.5%", mid: 13.2, max: "up to ৳20 Lakh", tenure: "1–5 yrs" }, home: { label: "11–13%", mid: 12, max: "up to ৳2 Cr", tenure: "up to 25 yrs" }, car: { label: "12–14%", mid: 13, max: "50% of car value", tenure: "up to 6 yrs" } } },
  { id: "mtb_l", name: "Mutual Trust Bank (MTB)", icon: "🤝", islamic: false, fee: "0.5–1% processing", elig: "Salaried / self-employed / business; min. income ~৳30K/mo (salaried)", note: "Strong, well-run private bank with some of the most competitive consumer rates in the market and an easy online apply form. Personal loan ৳50K–৳40 Lakh over 6–60 months; optional loan-shield insurance settles the balance on death or total disability. Rates per MTB's declared lending rate sheet (May 2026).", link: "https://www.mutualtrustbank.com/retail/retail-loan/", products: { personal: { label: "13–14.5%", mid: 13.5, max: "up to ৳40 Lakh", tenure: "6 mo – 5 yrs" }, home: { label: "10.5–11.5%", mid: 11, max: "up to ৳4 Cr", tenure: "up to 25 yrs" }, car: { label: "10.5–11.5%", mid: 11, max: "50% of car value (BB cap)", tenure: "up to 6 yrs" } } },
  { id: "dbh_l", name: "DBH Finance", icon: "🏠", islamic: false, fee: "0.5–1.5% processing", elig: "Anyone with verifiable income; home-loan specialist", note: "BD's dedicated housing-finance institution — deepest home loan expertise, flexible documentation.", link: "https://www.deltabrac.com", products: { home: { label: "10.5–13%", mid: 11.7, max: "up to ৳2 Cr", tenure: "up to 25 yrs" } } },
  { id: "prime_l", name: "Prime Bank", icon: "🏢", islamic: false, fee: "0.5–1% processing", elig: "Salaried / professional, min. income ~৳35K/mo", note: "Competitive across personal and home; good corporate-salary tie-ups.", link: "https://www.primebank.com.bd", products: { personal: { label: "12–14%", mid: 13, max: "up to ৳20 Lakh", tenure: "1–5 yrs" }, home: { label: "11–13%", mid: 12, max: "up to ৳2 Cr", tenure: "up to 25 yrs" }, car: { label: "12–14%", mid: 13, max: "50% of car value", tenure: "up to 6 yrs" } } },
  { id: "shahjalal_l", name: "Shahjalal Islami Bank", icon: "🕌", islamic: true, fee: "0.5–1% processing", elig: "Salaried / business; Shariah-based contracts", note: "Full-Shariah bank with clean governance (no S Alam ties). Murabaha (cost-plus) & HPSM/Ijarah (lease-to-own) instead of interest.", link: "https://www.sjiblbd.com", products: { personal: { label: "12–14% (Murabaha)", mid: 13, max: "up to ৳20 Lakh", tenure: "1–5 yrs" }, home: { label: "11–13.5% (HPSM)", mid: 12.2, max: "up to ৳2 Cr", tenure: "up to 20 yrs" }, car: { label: "12–14% (Ijarah)", mid: 13, max: "50% of car value", tenure: "up to 6 yrs" } } },
  { id: "cityislamic_l", name: "City Islamic", icon: "☪️", islamic: true, fee: "0.5–1% processing", elig: "Salaried / professional", note: "City Bank's Shariah window — Murabaha & Ijarah retail financing backed by a strong conventional bank.", link: "https://www.citybankplc.com", products: { personal: { label: "12–14.5% (Murabaha)", mid: 13.2, max: "up to ৳20 Lakh", tenure: "1–5 yrs" }, home: { label: "11–13% (HPSM)", mid: 12, max: "up to ৳2 Cr", tenure: "up to 20 yrs" } } },
];

const RISK = {
  low: { label: "Conservative", color: "#00D68F", bg: "rgba(0,214,143,0.10)", border: "rgba(0,214,143,0.35)", desc: "Protect my capital" },
  medium: { label: "Balanced", color: "#FFB454", bg: "rgba(255,180,84,0.10)", border: "rgba(255,180,84,0.35)", desc: "Growth with some safety" },
  high: { label: "Aggressive", color: "#FF6B6B", bg: "rgba(255,107,107,0.10)", border: "rgba(255,107,107,0.35)", desc: "Maximize my returns" },
};

const ALLOCATION = {
  low: [ { cat: "Sanchayapatra", pct: 45, color: "#4F9EFF" }, { cat: "FDR / DPS", pct: 30, color: "#00D68F" }, { cat: "iFarmer", pct: 15, color: "#FFB454" }, { cat: "Gold", pct: 10, color: "#E8C766" } ],
  medium: [ { cat: "Sanchayapatra / Bonds", pct: 30, color: "#4F9EFF" }, { cat: "Mutual Funds", pct: 25, color: "#B07CFF" }, { cat: "Blue-Chip Shares", pct: 25, color: "#00D68F" }, { cat: "iFarmer / Gold", pct: 20, color: "#FFB454" } ],
  high: [ { cat: "Growth Stocks", pct: 40, color: "#FF6B6B" }, { cat: "Blue-Chip Shares", pct: 30, color: "#00D68F" }, { cat: "Mutual Funds", pct: 20, color: "#B07CFF" }, { cat: "Safe (Bonds/FDR)", pct: 10, color: "#4F9EFF" } ],
};

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
  amber: "#FFB454",
  red: "#FF6B6B",
  border: "rgba(148,180,255,0.12)",
  borderSoft: "rgba(148,180,255,0.08)",
  glass: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
  glassFlat: "rgba(255,255,255,0.03)",
};

function fmt(n) {
  if (!n) return "৳0";
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} Lakh`;
  if (n >= 1000) return `৳${Math.round(n / 1000)}K`;
  return `৳${Math.round(n)}`;
}
const fmtFull = n => "৳" + Number(Math.round(n)).toLocaleString("en-IN");

/* EMI: standard reducing-balance formula */
function calcEMI(P, annualPct, years) {
  const n = years * 12, r = annualPct / 100 / 12;
  if (!P || !n) return 0;
  if (!r) return P / n;
  return P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

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
.fd-spin { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(79,158,255,0.3); border-top-color: #4F9EFF; border-radius: 50%; animation: fdSpin .7s linear infinite; vertical-align: -2px; }
.fd-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
.fd-tbl th { text-align: right; padding: 7px 8px; color: #5C6E8C; font-weight: 700; letter-spacing: .04em; border-bottom: 1px solid rgba(148,180,255,0.12); }
.fd-tbl th:first-child, .fd-tbl td:first-child { text-align: left; }
.fd-tbl td { text-align: right; padding: 7px 8px; color: #C9D8F0; border-bottom: 1px solid rgba(148,180,255,0.06); font-variant-numeric: tabular-nums; }
::-webkit-scrollbar { width: 10px; } ::-webkit-scrollbar-track { background: #04080F; }
::-webkit-scrollbar-thumb { background: #1B2B45; border-radius: 6px; }
@media (prefers-reduced-motion: reduce) { .fd-up, .fd-donut-seg { animation: none; } }
@media (max-width: 520px) { .fd-hide-sm { display: none !important; } }
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

/* ---------- Ambient background orbs ---------- */
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
function Counter({ value, format = fmtFull, duration = 700, style }) {
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
              return <circle key={i} className="fd-donut-seg" style={{ animationDelay: `${i * 0.12}s` }} cx="80" cy="80" r={r} fill="none" stroke={d.color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-off} />;
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

/* ---------- Small shared pieces ---------- */
function Tag({ children, color = T.accent, bg = T.accentSoft }) {
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 11px", borderRadius: 20, background: bg, color, border: `1px solid ${color}33`, letterSpacing: ".01em" }}>{children}</span>;
}
function MetaPill({ children }) {
  return <span style={{ fontSize: 12, color: T.muted, fontWeight: 500, background: "rgba(148,180,255,0.06)", border: `1px solid ${T.borderSoft}`, borderRadius: 7, padding: "3px 9px" }}>{children}</span>;
}
function UpdatedBadge() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: T.green, background: "rgba(0,214,143,0.08)", border: "1px solid rgba(0,214,143,0.3)", borderRadius: 20, padding: "5px 14px", letterSpacing: ".03em" }}>✓ Rates last updated: {LAST_UPDATED}</span>
    </div>
  );
}
function TabDisclaimer() {
  return (
    <p style={{ fontSize: 11.5, color: T.faint, lineHeight: 1.65, margin: "28px 6px 0", textAlign: "center", position: "relative", zIndex: 1 }}>
      Educational information only — not licensed financial advice. Rates verified {LAST_UPDATED} and change often; always confirm with the institution before committing money. FinDesh AI excludes institutions under Bangladesh Bank resolution or with known liquidity stress.
    </p>
  );
}
function SectionHead({ title, hint }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff" }}>{title}</h3>
      {hint && <span style={{ fontSize: 12.5, color: T.faint }}>{hint}</span>}
    </div>
  );
}

/* ---------- Sanchayapatra limits (individual ↔ joint toggle) ---------- */
function SanchayapatraLimits() {
  const [joint, setJoint] = useState(false);
  return (
    <div className="fd-up" style={{ ...card, marginBottom: 24, padding: "22px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff" }}>🏛️ Sanchayapatra investment limits</h3>
        <div style={{ display: "flex", background: "rgba(8,18,36,0.7)", border: `1px solid ${T.borderSoft}`, borderRadius: 10, padding: 3 }}>
          {[["Individual", false], ["Joint", true]].map(([label, v]) => (
            <button key={label} className="fd-tab" onClick={() => setJoint(v)} style={{ padding: "7px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", background: joint === v ? "linear-gradient(135deg, rgba(79,158,255,0.28), rgba(79,158,255,0.12))" : "transparent", color: joint === v ? "#fff" : T.muted, boxShadow: joint === v ? "inset 0 0 0 1px rgba(79,158,255,0.45)" : "none" }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: "auto", background: "rgba(8,18,36,0.5)", border: `1px solid ${T.borderSoft}`, borderRadius: 13, padding: "6px 10px" }}>
        <table className="fd-tbl">
          <thead><tr><th>Certificate</th><th>Minimum</th><th>{joint ? "Joint cap" : "Individual cap"}</th></tr></thead>
          <tbody>
            {SANCHAYAPATRA_LIMITS.map(s => {
              const cap = joint ? s.joint : s.indiv;
              return (
                <tr key={s.id}>
                  <td>{s.name} <span style={{ color: T.faint }}>· {s.bn}</span></td>
                  <td>{fmt(s.min)}</td>
                  <td style={{ color: cap ? "#fff" : T.faint, fontWeight: 700 }}>{cap ? fmt(cap) : "Single-name only"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ background: T.accentSoft, border: `1px solid ${T.accentBorder}`, borderRadius: 12, padding: "12px 14px", marginTop: 14 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: T.accent, letterSpacing: ".09em", marginBottom: 5 }}>COMBINED-PURCHASE RULE</div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#C9D8F0" }}>Buying more than one type? Your combined ceiling is the <b style={{ color: "#fff" }}>highest single limit</b> among the certificates you hold — not the sum. Example: 5-Year (৳30 Lakh) + Poribar (৳45 Lakh) together is capped at <b style={{ color: "#fff" }}>৳45 Lakh</b>, not ৳75 Lakh.</p>
      </div>
      <p style={{ margin: "10px 2px 0", fontSize: 11.5, color: T.faint, lineHeight: 1.6 }}>
        💡 Joint limits apply only to the 5-Year and 3-Monthly certificates; Poribar and Pensioner are single-name only. There is <b style={{ color: T.muted }}>no upper limit</b> for institutions, provident funds and approved superannuation/gratuity funds.
      </p>
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
            <span>📉 Real: <b style={{ color: real > 0 ? T.green : T.red }}>{real > 0 ? "+" : ""}{real}%</b> after inflation</span>
            {inst.max && <span>🔒 Max (individual): <b style={{ color: "#EAF1FC" }}>{fmt(inst.max)}</b></span>}
            {inst.maxJoint && <span>👥 Max (joint): <b style={{ color: "#EAF1FC" }}>{fmt(inst.maxJoint)}</b></span>}
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
    { v: "11.98%", l: "Top govt-backed rate" },
    { v: "৳500", l: "Minimum to start" },
    { v: "+14.8%", l: "DSEX last 12 months" },
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
function InvestPage({ seoHead, focus }) {
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
        <div style={{ textAlign: "center", padding: "52px 0 26px" }}>
          <div className="fd-up" style={pill}>🇧🇩 Bangladesh's First AI Personal Finance Platform</div>
          {seoHead
            ? <h1 className="fd-up fd-up-1" style={h1}>{seoHead.h1}</h1>
            : <h1 className="fd-up fd-up-1" style={h1}>You've earned it.<br />Now make it <span style={gradText}>grow</span>.</h1>}
          <p className="fd-up fd-up-2" style={sub}>{seoHead ? seoHead.sub : "Tell us how much you have and your risk comfort. Get a clear, Bangladesh-specific investment plan in seconds."}</p>
          <StatStrip />
        </div>
      )}
      {submitted && <div style={{ height: 22 }} />}
      <UpdatedBadge />

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
          <div className="fd-up" style={{ ...card, marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>Suggested allocation</h3>
            <Donut data={ALLOCATION[risk]} amount={num} />
          </div>
          {matched.some(i => SANCHAYAPATRA_LIMITS.some(s => s.id === i.id)) && <SanchayapatraLimits />}
          <SectionHead title={`${matched.length} options for you`} hint="Low → high risk · tap for detail" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {matched.map((i, idx) => <InvestCard key={i.id} inst={i} amount={num} idx={idx} />)}
          </div>
          <div style={inflationNote}>💡 BD inflation is ~{INFLATION}% (early 2026). Anything returning less is quietly losing you purchasing power — which is why a savings account (3–5%) hurts.</div>
        </div>
      )}
      <RelatedLinks links={[
        { label: "Sanchayapatra rates & limits", path: "/sanchayapatra" },
        { label: "Savings & DPS planner", path: "/save" },
        { label: "Loan EMI calculator", path: "/borrow" },
        { label: "Money Blueprint", path: "/blueprint" },
      ]} />
      <TabDisclaimer />
    </>
  );
}

/* ============================================================
   SAVINGS PLANNER PAGE
   ============================================================ */
function SavingsPage({ seoHead, focus }) {
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
          {seoHead
            ? <h1 className="fd-up fd-up-1" style={h1}>{seoHead.h1}</h1>
            : <h1 className="fd-up fd-up-1" style={h1}>Build the habit.<br />Reach the <span style={gradText}>goal</span>.</h1>}
          <p className="fd-up fd-up-2" style={sub}>{seoHead ? seoHead.sub : "Tell us what you can save monthly — or what you're saving toward — and see exactly where to put it and what it'll grow to."}</p>
        </div>
      )}
      {submitted && <div style={{ height: 22 }} />}
      <UpdatedBadge />

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

          <SectionHead title={`${options.length} ways to save ${fmt(effectiveMonthly)}/mo`} hint="Highest rate first · tap for detail" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {options.map((s, idx) => <SavingsCard key={s.id} s={s} monthly={effectiveMonthly} months={months} idx={idx} />)}
          </div>

          <div style={inflationNote}>💡 A DPS auto-deducts on a fixed date each month — the single best trick for building a savings habit. Set it and forget it.</div>

          <div className="fd-up" style={{ marginTop: 24, background: T.glass, borderRadius: 20, padding: "24px 20px", textAlign: "center", border: `1px solid ${T.border}`, backdropFilter: "blur(16px)" }}>
            <h3 style={{ margin: "0 0 7px", fontSize: 16, fontWeight: 800, color: "#fff" }}>Got a lump sum sitting idle too?</h3>
            <p style={{ margin: "0 0 15px", fontSize: 13.5, color: T.muted }}>Saving monthly is step one. If you also have a lump sum, the Invest tool shows where to put it.</p>
            <span style={{ fontSize: 13.5, color: T.accent, fontWeight: 700 }}>→ Switch to the Invest tab above</span>
          </div>
        </div>
      )}
      <RelatedLinks links={[
        { label: "Where to invest a lump sum", path: "/invest" },
        { label: "Sanchayapatra rates & limits", path: "/sanchayapatra" },
        { label: "Loan EMI calculator", path: "/borrow" },
        { label: "Money Blueprint", path: "/blueprint" },
      ]} />
      <TabDisclaimer />
    </>
  );
}

/* ============================================================
   BORROW PAGE — Part A: live EMI calculator · Part B: comparison
   ============================================================ */
function StatBox({ label, value, color = "#fff", big = false }) {
  return (
    <div style={{ flex: "1 1 120px", background: "rgba(8,18,36,0.6)", border: `1px solid ${T.borderSoft}`, borderRadius: 13, padding: "13px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 10.5, color: T.faint, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: big ? 24 : 16, fontWeight: 900, color, letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}

function amortYears(P, annualPct, years) {
  const r = annualPct / 100 / 12, emiV = calcEMI(P, annualPct, years);
  const rows = []; let bal = P;
  for (let y = 1; y <= years; y++) {
    let pPaid = 0, iPaid = 0;
    for (let m = 0; m < 12; m++) {
      if (bal <= 0) break;
      const interest = bal * r;
      const principal = Math.min(emiV - interest, bal);
      iPaid += interest; pPaid += principal; bal -= principal;
    }
    rows.push({ y, pPaid, iPaid, bal: Math.max(bal, 0) });
    if (bal <= 0) break;
  }
  return rows;
}

function EMICalculator() {
  const [amount, setAmount] = useState("1000000");
  const [rate, setRate] = useState("12.5");
  const [years, setYears] = useState(5);
  const [showTable, setShowTable] = useState(false);
  const [ai, setAi] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const P = Number(String(amount).replace(/[^0-9]/g, ""));
  const R = Math.min(Number(String(rate).replace(/[^0-9.]/g, "")) || 0, 40);
  const emiV = calcEMI(P, R, years);
  const totalPaid = emiV * years * 12;
  const totalInterest = totalPaid - P;
  const interestPct = P ? (totalInterest / P) * 100 : 0;
  const principalShare = totalPaid ? (P / totalPaid) * 100 : 50;
  const schedule = useMemo(() => (P && R ? amortYears(P, R, years) : []), [P, R, years]);

  const localInsight = () => {
    const lines = [];
    if (interestPct > 60) lines.push(`Over ${years} years you'd pay ${fmt(totalInterest)} in interest — that's ${interestPct.toFixed(0)}% of what you're borrowing. That is a heavy cost; consider a shorter tenure or a larger down payment.`);
    else if (interestPct > 30) lines.push(`You'd pay ${fmt(totalInterest)} in interest (${interestPct.toFixed(0)}% of principal). Manageable, but shaving 1–2 years off the tenure would save a lot.`);
    else lines.push(`Total interest of ${fmt(totalInterest)} (${interestPct.toFixed(0)}% of principal) is on the reasonable side for BD rates.`);
    if (R > 14) lines.push(`At ${R}%, your rate is above the current market range (personal ~12–15%, home ~10–13%) — shop around before signing.`);
    lines.push(`Rule of thumb: keep total EMIs under 35–40% of monthly take-home pay. This loan needs ~${fmt(emiV / 0.4)}/month income to be comfortable.`);
    return lines.join(" ");
  };

  const askAI = async () => {
    setAiLoading(true); setAi("");
    try {
      const key = import.meta.env.VITE_GEMINI_KEY;
      if (!key) throw new Error("no-key");
      const prompt = `You are a Bangladeshi personal finance expert. A user is considering a loan: amount ৳${P.toLocaleString("en-IN")}, interest rate ${R}% p.a., tenure ${years} years. Monthly EMI ৳${Math.round(emiV).toLocaleString("en-IN")}, total interest ৳${Math.round(totalInterest).toLocaleString("en-IN")} (${interestPct.toFixed(0)}% of principal). Context: BD policy rate 10%, inflation ~8.6%, personal loans 12-15%, home loans 10-13%. In 3-4 short sentences, tell them honestly whether this loan looks worth it, what to watch for, and one concrete tip. Plain language, no markdown headers.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("empty");
      setAi(text.trim());
    } catch {
      setAi(localInsight());
    } finally { setAiLoading(false); }
  };

  return (
    <div className="fd-up fd-up-3" style={card}>
      <label style={lbl}>Loan amount</label>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={taka}>৳</span>
        <input className="fd-input" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="10,00,000" style={bigInput} />
        {P > 0 && <span style={inputHint}>{fmt(P)}</span>}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[100000, 500000, 1000000, 5000000].map(q => <button key={q} className="fd-chip" onClick={() => setAmount(String(q))} style={chip(P === q)}>{fmt(q)}</button>)}
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
        <div style={{ flex: "1 1 160px" }}>
          <label style={lbl}>Interest rate (% / year)</label>
          <input className="fd-input" value={rate} onChange={e => setRate(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="12.5" style={{ ...bigInput, padding: "14px 16px", fontSize: 20 }} />
          <div style={{ fontSize: 11.5, color: T.faint, marginTop: 6 }}>BD average: personal ~12–15% · home ~10–13%</div>
        </div>
        <div style={{ flex: "2 1 260px" }}>
          <label style={lbl}>Tenure</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[1, 2, 3, 5, 7, 10, 15, 20].map(y => (
              <button key={y} className="fd-chip" onClick={() => setYears(y)} style={{ ...chip(years === y), flex: "1 0 56px" }}>{y} yr{y > 1 ? "s" : ""}</button>
            ))}
          </div>
        </div>
      </div>

      {P > 0 && R > 0 && (
        <div className="fd-up">
          <div style={{ background: "linear-gradient(135deg, rgba(79,158,255,0.16), rgba(8,18,36,0.9))", border: `1px solid ${T.accentBorder}`, borderRadius: 18, padding: "22px 20px", textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: T.accent, fontWeight: 800, letterSpacing: ".09em", marginBottom: 8 }}>YOUR MONTHLY EMI</div>
            <div style={{ fontSize: 38, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
              <Counter value={emiV} /><span style={{ fontSize: 16, color: T.muted, fontWeight: 600 }}>/month</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <StatBox label="Total paid" value={fmt(totalPaid)} />
            <StatBox label="Total interest" value={fmt(totalInterest)} color={T.amber} />
            <StatBox label="Interest vs principal" value={`${interestPct.toFixed(0)}%`} color={interestPct > 50 ? T.red : interestPct > 25 ? T.amber : T.green} />
          </div>

          {/* principal vs interest bar */}
          <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", fontSize: 11.5, color: T.muted, fontWeight: 600 }}>
            <span><span style={{ color: T.accent }}>■</span> Principal {fmt(P)}</span>
            <span><span style={{ color: T.amber }}>■</span> Interest {fmt(totalInterest)}</span>
          </div>
          <div style={{ display: "flex", height: 14, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.borderSoft}`, marginBottom: 18 }}>
            <div style={{ width: `${principalShare}%`, background: "linear-gradient(90deg,#2563EB,#4F9EFF)", transition: "width .5s ease" }} />
            <div style={{ width: `${100 - principalShare}%`, background: "linear-gradient(90deg,#B07C2E,#FFB454)", transition: "width .5s ease" }} />
          </div>

          <button className="fd-chip" onClick={() => setShowTable(s => !s)} style={{ ...chip(showTable), width: "100%", marginBottom: showTable ? 12 : 18, padding: "11px" }}>
            {showTable ? "Hide" : "Show"} year-by-year breakdown {showTable ? "▲" : "▼"}
          </button>
          {showTable && (
            <div className="fd-up" style={{ overflowX: "auto", marginBottom: 18, background: "rgba(8,18,36,0.5)", border: `1px solid ${T.borderSoft}`, borderRadius: 13, padding: "6px 10px" }}>
              <table className="fd-tbl">
                <thead><tr><th>Year</th><th>Principal paid</th><th>Interest paid</th><th>Balance left</th></tr></thead>
                <tbody>
                  {schedule.map(rw => (
                    <tr key={rw.y}><td>Year {rw.y}</td><td>{fmtFull(rw.pPaid)}</td><td style={{ color: "#FFCE8A" }}>{fmtFull(rw.iPaid)}</td><td>{fmtFull(rw.bal)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button className="fd-cta" onClick={askAI} disabled={aiLoading} style={{ ...cta, background: "linear-gradient(135deg,#7C3AED,#4F9EFF)", opacity: aiLoading ? 0.7 : 1 }}>
            {aiLoading ? <>Thinking <span className="fd-spin" /></> : "🤖 Is this loan worth it? — Ask FinDesh AI"}
          </button>
          {ai && (
            <div className="fd-up" style={{ marginTop: 14, background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.35)", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#B89AFF", letterSpacing: ".09em", marginBottom: 6 }}>FINDESH AI INSIGHT</div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "#D8CCF5", whiteSpace: "pre-wrap" }}>{ai}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LenderCard({ l, type, idx }) {
  const [open, setOpen] = useState(false);
  const prod = l.products[type];
  if (!prod) return null;
  return (
    <div className={`fd-item fd-up fd-up-${Math.min(idx, 3)}`} onClick={() => setOpen(o => !o)} style={{ background: T.glass, border: `1px solid ${T.border}`, borderRadius: 18, padding: "18px 20px", cursor: "pointer", backdropFilter: "blur(16px)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: l.islamic ? T.green : T.accent, opacity: 0.85 }} />
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: T.accentSoft, border: `1px solid ${T.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{l.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15.5, color: "#fff" }}>{l.name}</span>
            {l.islamic && <Tag color={T.green} bg="rgba(0,214,143,0.10)">☪ Shariah</Tag>}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 7, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: l.islamic ? T.green : T.accent }}>{prod.label}</span>
            <MetaPill>⏱ {prod.tenure}</MetaPill>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 10.5, color: T.faint, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase" }}>max</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#C9D8F0" }}>{prod.max || "—"}</div>
        </div>
      </div>
      {open && (
        <div className="fd-up" style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderSoft}` }}>
          <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.65, color: "#B8C7E0" }}>{l.note}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, fontSize: 12.5, color: T.muted, marginBottom: 12 }}>
            <span>🧾 Fees: <b style={{ color: "#C9D8F0" }}>{l.fee}</b></span>
            <span>✅ Eligibility: <b style={{ color: "#C9D8F0" }}>{l.elig}</b></span>
            <span>📋 Rate band shown is indicative ({LAST_UPDATED}) — your offer depends on income, employer & credit history. Always get a formal rate letter.</span>
          </div>
          {l.link && <a className="fd-link" href={l.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-block", fontSize: 13, color: T.accent, fontWeight: 700, textDecoration: "none" }}>Visit bank / apply →</a>}
        </div>
      )}
    </div>
  );
}

function BorrowPage({ initialType }) {
  const [type, setType] = useState(initialType || "personal");
  useEffect(() => { if (initialType) setType(initialType); }, [initialType]);
  const types = [["personal", "Personal"], ["home", "Home"], ["car", "Car"], ["islamic", "Islamic ☪"]];
  const effType = l => (type === "islamic" ? (l.products.personal ? "personal" : "home") : type);
  const list = LENDERS
    .filter(l => (type === "islamic" ? l.islamic : !!l.products[type]))
    .sort((a, b) => (a.products[effType(a)]?.mid ?? 99) - (b.products[effType(b)]?.mid ?? 99));

  return (
    <>
      <div style={{ textAlign: "center", padding: "52px 0 26px" }}>
        <div className="fd-up" style={pill}>🏦 Borrow Smart · স্মার্ট ঋণ</div>
        <h1 className="fd-up fd-up-1" style={h1}>Borrow smart.<br />Pay <span style={gradText}>less</span>.</h1>
        <p className="fd-up fd-up-2" style={sub}>See your real EMI, the true interest cost, and which lender actually fits — before you sign anything. Policy rate is {POLICY_RATE}%, so loans are pricey: borrow deliberately.</p>
      </div>
      <UpdatedBadge />

      <EMICalculator />

      <div style={{ marginTop: 34 }}>
        <SectionHead title="Compare lenders" hint="Lowest rate first · tap for detail" />
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {types.map(([k, label]) => (
            <button key={k} className="fd-chip" onClick={() => setType(k)} style={{ ...chip(type === k), flex: 1, minWidth: 80, padding: "11px 6px", fontSize: 13 }}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map((l, idx) => <LenderCard key={l.id} l={l} type={effType(l)} idx={idx} />)}
        </div>
        <div style={inflationNote}>💡 Bangladesh Bank caps car loans at 50% of vehicle value, and most banks cap unsecured personal loans at ৳20 Lakh. A 1% lower rate on a 20-year home loan saves several lakh taka — always negotiate.</div>
      </div>
      <RelatedLinks links={[
        { label: "Where to invest instead", path: "/invest" },
        { label: "Sanchayapatra rates & limits", path: "/sanchayapatra" },
        { label: "Savings & DPS planner", path: "/save" },
        { label: "Money Blueprint", path: "/blueprint" },
      ]} />
      <TabDisclaimer />
    </>
  );
}

/* ============================================================
   BLUEPRINT PAGE — the BD Money System (guide, not a tool)
   ============================================================ */
function Callout({ icon = "💡", children, color = T.accent }) {
  return (
    <div style={{ background: `${color}14`, border: `1px solid ${color}40`, borderRadius: 13, padding: "12px 15px", margin: "12px 0", fontSize: 13.5, lineHeight: 1.65, color: "#D6E2F5" }}>
      <span style={{ marginRight: 7 }}>{icon}</span>{children}
    </div>
  );
}
function GuideHead({ kicker, title }) {
  return (
    <div style={{ margin: "44px 0 20px" }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: T.accent, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 6 }}>{kicker}</div>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>{title}</h2>
    </div>
  );
}

/* --- Calculator 1: Emergency fund --- */
function EmergencyCalc() {
  const [exp, setExp] = useState("");
  const n = Number(String(exp).replace(/[^0-9]/g, ""));
  return (
    <div style={{ ...card, padding: "22px 20px", margin: "18px 0" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.green, letterSpacing: ".09em", marginBottom: 12 }}>🛟 EMERGENCY FUND CALCULATOR</div>
      <label style={lbl}>Your monthly expenses</label>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <span style={taka}>৳</span>
        <input className="fd-input" value={exp} onChange={e => setExp(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="40,000" style={{ ...bigInput, fontSize: 20, padding: "14px 16px 14px 42px" }} />
      </div>
      {n > 0 && (
        <div className="fd-up">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <StatBox label="3 months · bare minimum" value={fmt(n * 3)} color={T.amber} />
            <StatBox label="6 months · recommended" value={fmt(n * 6)} color={T.green} />
            <StatBox label="12 months · gold standard" value={fmt(n * 12)} />
          </div>
          <Callout icon="📍" color={T.green}>Park it where you can reach it in 1–3 days but won't spend it: a separate high-rate savings account or a 3-month auto-renewing FDR at a strong bank — not Sanchayapatra (locked) and not your bKash daily wallet (too spendable).</Callout>
        </div>
      )}
    </div>
  );
}

/* --- Calculator 2: Salary split --- */
function SalarySplitCalc() {
  const [sal, setSal] = useState("");
  const n = Number(String(sal).replace(/[^0-9]/g, ""));
  const rows = [
    { label: "Fixed costs", hint: "rent, utilities, transport, groceries", pct: 55, color: "#4F9EFF" },
    { label: "Savings + investments", hint: "DPS, Sanchayapatra, funds", pct: 20, color: "#00D68F" },
    { label: "Guilt-free spending", hint: "eating out, gadgets, fun — no shame", pct: 20, color: "#B07CFF" },
    { label: "Emergency top-up", hint: "until your fund hits 6 months", pct: 5, color: "#FFB454" },
  ];
  return (
    <div style={{ ...card, padding: "22px 20px", margin: "18px 0" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: ".09em", marginBottom: 12 }}>💸 SALARY SPLIT CALCULATOR</div>
      <label style={lbl}>Your monthly take-home salary</label>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <span style={taka}>৳</span>
        <input className="fd-input" value={sal} onChange={e => setSal(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="60,000" style={{ ...bigInput, fontSize: 20, padding: "14px 16px 14px 42px" }} />
      </div>
      {n > 0 && (
        <div className="fd-up">
          <div style={{ display: "flex", height: 14, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.borderSoft}`, marginBottom: 14 }}>
            {rows.map(r => <div key={r.label} style={{ width: `${r.pct}%`, background: r.color }} />)}
          </div>
          {rows.map(r => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0", borderBottom: `1px solid ${T.borderSoft}` }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: r.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, color: "#C9D8F0", flex: 1 }}>{r.label} <span style={{ color: T.faint, fontSize: 11.5 }}>· {r.hint}</span></span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{r.pct}%</span>
              <span style={{ fontSize: 13, color: r.color, minWidth: 78, textAlign: "right", fontWeight: 700 }}>{fmtFull(n * r.pct / 100)}</span>
            </div>
          ))}
          <Callout icon="🎯">These are starting targets for a Dhaka salaried professional — rent alone often eats 30–40%. If fixed costs run above 60%, the fix is usually housing or transport, not skipping tea. Adjust the ratios, but never let savings hit 0%.</Callout>
        </div>
      )}
    </div>
  );
}

/* --- Calculator 3: Inflation check --- */
function InflationCheck() {
  const [r, setR] = useState("");
  const n = Number(String(r).replace(/[^0-9.]/g, ""));
  const real = n - INFLATION;
  const pass = real > 0;
  return (
    <div style={{ ...card, padding: "22px 20px", margin: "18px 0" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.amber, letterSpacing: ".09em", marginBottom: 12 }}>🔥 AM I BEATING INFLATION?</div>
      <label style={lbl}>Your current return (% / year)</label>
      <input className="fd-input" value={r} onChange={e => setR(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="e.g. 5 for a savings account" style={{ ...bigInput, fontSize: 20, padding: "14px 16px" }} />
      {r !== "" && (
        <div className="fd-up" style={{ marginTop: 14, background: pass ? "rgba(0,214,143,0.10)" : "rgba(255,107,107,0.10)", border: `1px solid ${pass ? "rgba(0,214,143,0.4)" : "rgba(255,107,107,0.4)"}`, borderRadius: 14, padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: pass ? T.green : T.red, letterSpacing: "-0.02em" }}>{pass ? "✓ PASS" : "✗ FAIL"} · {real > 0 ? "+" : ""}{real.toFixed(1)}% real return</div>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#C9D8F0", lineHeight: 1.6 }}>
            {pass
              ? `After ~${INFLATION}% inflation your money is genuinely growing. Keep going — and check the Invest tab to push it further.`
              : `After ~${INFLATION}% inflation your money is losing purchasing power every single month. ${n <= 5 ? "A typical savings account does exactly this — " : ""}Move it: even a 3-month Sanchayapatra pays ~11.8%.`}
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- The guide offer (bKash · "buy me a coffee" tone) ----------
   Pure client-side. The transaction-ID field is intentionally NOT logged,
   stored or sent anywhere — it only makes the flow feel complete. The
   founder spot-checks payments by hand in the bKash app. */
const GUIDE_LINK = "https://drive.google.com/file/d/10R2fGzsL4_ExlG3Odh5tjpOsnOvXzkoQ/view?usp=sharing";
const BKASH_NUMBER = "01720408431";
const GUIDE_GREEN = "#4ADE80";

function GuideOffer() {
  const [amount, setAmount] = useState("50");
  const [txn, setTxn] = useState("");
  const [done, setDone] = useState(false);
  const amt = Number(String(amount).replace(/[^0-9]/g, ""));
  const quick = [50, 100, 200, 500];

  const getGuide = () => { if (!txn.trim()) return; setDone(true); /* no logging / no storage — intentional */ };

  if (done) {
    return (
      <div className="fd-up" style={{ ...card, padding: "32px 24px", marginBottom: 30, textAlign: "center", border: "1px solid rgba(0,214,143,0.35)", background: "linear-gradient(135deg, rgba(0,214,143,0.10), rgba(8,18,36,0.92))" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>Thank you — you're in 💚</h2>
        <p style={{ margin: "0 auto 20px", fontSize: 14.5, color: "#C9D8F0", lineHeight: 1.65, maxWidth: 420 }}>
          That genuinely means a lot. Your copy of the FinDesh Money Guide is ready — open it, save it, and most importantly, <b style={{ color: "#fff" }}>use it</b>. Even one habit from it can put lakhs back in your pocket over the years.
        </p>
        <a href={GUIDE_LINK} target="_blank" rel="noreferrer" className="fd-cta" style={{ ...cta, display: "inline-block", width: "auto", padding: "16px 30px", textDecoration: "none" }}>
          📖 Open your FinDesh Money Guide →
        </a>
        <p style={{ margin: "16px auto 0", fontSize: 12, color: T.faint, lineHeight: 1.6, maxWidth: 380 }}>
          Trouble opening it? The link is also here:{" "}
          <a href={GUIDE_LINK} target="_blank" rel="noreferrer" style={{ color: T.accent, wordBreak: "break-all" }}>{GUIDE_LINK}</a>
        </p>
      </div>
    );
  }

  return (
    <div className="fd-up" style={{ ...card, padding: "26px 22px", marginBottom: 30, overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, ${T.accent}, ${GUIDE_GREEN})`, opacity: 0.9 }} />
      <div style={{ display: "inline-block", fontSize: 12, fontWeight: 800, color: GUIDE_GREEN, background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.32)", borderRadius: 20, padding: "5px 14px", marginBottom: 14, letterSpacing: ".02em" }}>☕ Buy me a coffee, get the guide</div>
      <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.12 }}>Stop guessing with <span style={gradText}>your money</span>.</h2>
      <p style={{ margin: "0 0 18px", fontSize: 14.5, lineHeight: 1.7, color: "#B8C7E0" }}>
        One clear, do-it-this-weekend playbook for growing what you earn in Bangladesh — the smart moves, in the right order, minus the noise and the jargon. It's the stuff most people learn the slow, expensive way. Apply it and it can quietly put <b style={{ color: "#fff" }}>thousands — even lakhs</b> — back in your pocket over the years.
      </p>

      <label style={lbl}>Pay what feels right — ৳50 is plenty 💙</label>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={taka}>৳</span>
        <input className="fd-input" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="50" style={{ ...bigInput, fontSize: 22, padding: "14px 16px 14px 42px" }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {quick.map(q => <button key={q} className="fd-chip" onClick={() => setAmount(String(q))} style={chip(amt === q)}>৳{q}</button>)}
      </div>

      {/* bKash payment panel — FinDesh palette (navy/blue + green accents) */}
      <div style={{ background: "rgba(79,158,255,0.06)", border: `1px solid ${T.accentBorder}`, borderRadius: 16, padding: "18px 18px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#8AC2FF", letterSpacing: ".03em" }}>bKash · Send Money (Personal)</span>
          <span style={{ fontSize: 19, fontWeight: 900, color: "#fff", letterSpacing: "0.04em", fontVariantNumeric: "tabular-nums" }}>{BKASH_NUMBER}</span>
        </div>
        <div style={{ display: "flex", gap: 11, marginBottom: 9 }}>
          <span style={stepDot}>1</span>
          <span style={{ fontSize: 13.5, color: "#D6E2F5", lineHeight: 1.55 }}>Open your <b style={{ color: "#fff" }}>bKash</b> app and choose <b style={{ color: "#fff" }}>"Send Money"</b> to the number above.</span>
        </div>
        <div style={{ display: "flex", gap: 11 }}>
          <span style={stepDot}>2</span>
          <span style={{ fontSize: 13.5, color: "#D6E2F5", lineHeight: 1.55 }}>In the <b style={{ color: "#fff" }}>Reference</b> field, simply write <b style={{ color: "#fff" }}>your name</b>.</span>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <label style={lbl}>Enter the last 3 digits of the Transaction ID (or the number you sent from)</label>
        <input className="fd-input" value={txn} onChange={e => setTxn(e.target.value)} onKeyDown={e => e.key === "Enter" && getGuide()} inputMode="text" placeholder="e.g. 7X9 or your number" style={{ ...bigInput, fontSize: 18, padding: "14px 16px", letterSpacing: "0.06em" }} />
      </div>

      <button className="fd-cta" onClick={getGuide} disabled={!txn.trim()} style={{ ...cta, marginTop: 16, opacity: txn.trim() ? 1 : 0.55, cursor: txn.trim() ? "pointer" : "not-allowed" }}>
        Get the Guide →
      </button>
      <p style={{ margin: "14px 2px 0", fontSize: 12, color: T.faint, lineHeight: 1.6, textAlign: "center" }}>
        ✨ Instant access — the guide opens right after you tap. No waiting, no account, no spam. Thank you for supporting a one-person project. 🙏
      </p>
    </div>
  );
}

function BlueprintPage() {
  return (
    <>
      <div style={{ textAlign: "center", padding: "34px 0 18px" }}>
        <div className="fd-up" style={pill}>🗺️ BD Money Blueprint · মানি ব্লুপ্রিন্ট</div>
        <h1 className="fd-up fd-up-1" style={{ ...h1, fontSize: "clamp(26px,5.5vw,40px)" }}>Your money,<br />on <span style={gradText}>autopilot</span>.</h1>
        <p className="fd-up fd-up-2" style={sub}>A conscious spending plan and money guide for Bangladeshi earners — rebuilt for BD banks, BD instruments, and Dhaka's cost of living.</p>
      </div>

      {/* Guide offer — above the fold on mobile & desktop */}
      <GuideOffer />

      <GuideHead kicker="The plan" title="The BD Conscious Spending Plan" />
      <div style={{ ...card, padding: "26px 22px" }}>
        <p style={{ margin: "0 0 6px", fontSize: 14, lineHeight: 1.75, color: "#B8C7E0" }}>
          Budgets fail because they're all restriction. A conscious spending plan flips it: decide your splits once, automate them, then spend the rest <b style={{ color: "#fff" }}>without guilt</b>. For a Dhaka salaried professional, start here and tune:
        </p>
        <SalarySplitCalc />
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: T.muted }}>
          Reality check for Dhaka: a 2-bed flat in a mid-range area runs ৳25–45K, so fixed costs at 55% assumes shared housing or living slightly further out. If you're early-career and rent pushes 70%, keep savings alive at even 5–10% — the habit matters more than the amount. Cut ruthlessly on things you don't care about; spend lavishly on the few you do.
        </p>
      </div>

      <GuideHead kicker="Safety net first" title="How big should your emergency fund be?" />
      <div style={{ ...card, padding: "24px 22px" }}>
        <p style={{ margin: "0 0 4px", fontSize: 14, lineHeight: 1.75, color: "#B8C7E0" }}>
          Before any investing, park 3–6 months of expenses somewhere liquid you never touch — a high-rate savings account or a 3-month auto-renewing FDR at a strong bank. This is what stops a job loss or hospital bill from becoming a 14% personal loan.
        </p>
        <EmergencyCalc />
      </div>

      <GuideHead kicker="Check yourself" title="Is your money actually growing?" />
      <InflationCheck />

      <div className="fd-up" style={{ marginTop: 24, background: "linear-gradient(135deg, rgba(79,158,255,0.16), rgba(8,18,36,0.9))", border: `1px solid ${T.accentBorder}`, borderRadius: 20, padding: "26px 22px", textAlign: "center" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 900, color: "#fff" }}>Ready to put it to work?</h3>
        <p style={{ margin: "0 0 4px", fontSize: 13.5, color: T.muted, lineHeight: 1.65 }}>Use the <b style={{ color: T.accent }}>Save</b> tab to set up your DPS, the <b style={{ color: T.accent }}>Invest</b> tab for a lump sum, and run any loan through <b style={{ color: T.accent }}>Borrow</b> before you sign.</p>
      </div>
      <RelatedLinks links={[
        { label: "Where to invest", path: "/invest" },
        { label: "Savings & DPS planner", path: "/save" },
        { label: "Sanchayapatra rates & limits", path: "/sanchayapatra" },
        { label: "Loan EMI calculator", path: "/borrow" },
      ]} />
      <TabDisclaimer />
    </>
  );
}

/* ============================================================
   SANCHAYAPATRA — standalone, in-depth SEO page (its own URL).
   High-search term, so it gets a dedicated page on top of being a
   selectable option inside the Invest tool.
   ============================================================ */
const SANCHAYA_IDS = ["sanchayapatra", "sp3m", "paribar", "pensioner"];

function SanchayapatraCalc() {
  const [amount, setAmount] = useState("500000");
  const [certId, setCertId] = useState("sanchayapatra");
  const list = INSTRUMENTS.filter(i => SANCHAYA_IDS.includes(i.id));
  const cert = list.find(i => i.id === certId) || list[0];
  const num = Number(String(amount).replace(/[^0-9]/g, ""));
  const annual = num * cert.rate / 100;
  const real = (cert.rate - INFLATION).toFixed(1);
  return (
    <div style={{ ...card, padding: "24px 22px", margin: "0 0 24px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: ".09em", marginBottom: 12 }}>🧮 SANCHAYAPATRA PROFIT CALCULATOR</div>
      <label style={lbl}>Which certificate?</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {list.map(c => (
          <button key={c.id} className="fd-chip" onClick={() => setCertId(c.id)} style={{ ...chip(certId === c.id), flex: "1 1 46%", fontSize: 12 }}>
            {c.name.replace(" Sanchayapatra", "")} · {c.rateLabel}
          </button>
        ))}
      </div>
      <label style={lbl}>How much are you investing?</label>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={taka}>৳</span>
        <input className="fd-input" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="5,00,000" style={bigInput} />
        {num > 0 && <span style={inputHint}>{fmt(num)}</span>}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[100000, 500000, 1000000, 3000000].map(q => <button key={q} className="fd-chip" onClick={() => setAmount(String(q))} style={chip(num === q)}>{fmt(q)}</button>)}
      </div>
      {num > 0 && (
        <div className="fd-up">
          <div style={{ background: "linear-gradient(135deg, rgba(79,158,255,0.16), rgba(8,18,36,0.9))", border: `1px solid ${T.accentBorder}`, borderRadius: 16, padding: "20px", textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: T.accent, fontWeight: 800, letterSpacing: ".09em", marginBottom: 7 }}>EST. PROFIT · ~1 YEAR AT {cert.rateLabel}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: T.green }}>+<Counter value={annual} /></div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <StatBox label="Min to invest" value={fmt(cert.min)} />
            <StatBox label="Real return (after inflation)" value={`${real > 0 ? "+" : ""}${real}%`} color={real > 0 ? T.green : T.red} />
            <StatBox label="Individual cap" value={cert.max ? fmt(cert.max) : "—"} />
          </div>
          <p style={{ margin: "12px 2px 0", fontSize: 11.5, color: T.faint, lineHeight: 1.6 }}>Gross estimate. A 5–10% source tax applies (the higher tier above ৳7.5 Lakh); payout frequency varies by certificate. Rate is locked at purchase for the full term.</p>
        </div>
      )}
    </div>
  );
}

function SanchayapatraPage() {
  const nav = useNav();
  const list = INSTRUMENTS.filter(i => SANCHAYA_IDS.includes(i.id));
  return (
    <>
      <div style={{ textAlign: "center", padding: "44px 0 20px" }}>
        <div className="fd-up" style={pill}>🏛️ Sanchayapatra · সঞ্চয়পত্র</div>
        <h1 className="fd-up fd-up-1" style={{ ...h1, fontSize: "clamp(28px,6vw,44px)" }}>Sanchayapatra: rates, limits &amp; <span style={gradText}>profit</span></h1>
        <p className="fd-up fd-up-2" style={sub}>Bangladesh's best risk-free return — government-guaranteed, ~11.8–11.98% (Jan 2026). Here are the current rates, the real investment limits (individual vs joint), and a free profit calculator.</p>
      </div>
      <UpdatedBadge />

      <SanchayapatraCalc />

      <SectionHead title="The four certificates" hint="Rate · minimum · payout" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 8 }}>
        {list.map((c, idx) => (
          <div key={c.id} className={`fd-item fd-up fd-up-${Math.min(idx, 3)}`} style={{ background: T.glass, border: `1px solid ${T.border}`, borderRadius: 16, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: T.green, opacity: 0.85 }} />
            <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(0,214,143,0.10)", border: "1px solid rgba(0,214,143,0.30)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{c.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: T.faint }}>{c.bn}</span>
                </div>
                <div style={{ fontSize: 12.5, color: T.muted, marginTop: 5, lineHeight: 1.6 }}>Min {fmt(c.min)} · {c.horizon} · cap {c.max ? fmt(c.max) : "—"}{c.maxJoint ? ` (৳${c.maxJoint / 100000} Lakh joint)` : ""}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.green, flexShrink: 0 }}>{c.rateLabel}</div>
            </div>
          </div>
        ))}
      </div>

      <SanchayapatraLimits />

      <div style={{ ...card, padding: "24px 22px", marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 800, color: "#fff" }}>Investing jointly</h3>
        <p style={{ margin: "0 0 10px", fontSize: 13.5, lineHeight: 1.7, color: "#B8C7E0" }}>
          For the <b style={{ color: "#fff" }}>5-Year Bangladesh</b> and <b style={{ color: "#fff" }}>3-Monthly Profit</b> certificates, two people can invest jointly — and the ceiling doubles to <b style={{ color: "#fff" }}>৳60 Lakh</b> versus ৳30 Lakh individually. It's a common way for couples or a parent and adult child to park more in the safest instrument in the country.
        </p>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: T.muted }}>
          <b style={{ color: "#C9D8F0" }}>Poribar</b> and <b style={{ color: "#C9D8F0" }}>Pensioner</b> are single-name only — no joint option. And if you buy more than one type, your combined ceiling is the <b style={{ color: "#C9D8F0" }}>highest single limit</b> among them, not the sum. Institutions, provident funds and approved gratuity/superannuation funds have no upper limit at all.
        </p>
      </div>

      <div className="fd-up" style={{ marginTop: 4, background: "linear-gradient(135deg, rgba(79,158,255,0.16), rgba(8,18,36,0.9))", border: `1px solid ${T.accentBorder}`, borderRadius: 20, padding: "24px 22px", textAlign: "center" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 900, color: "#fff" }}>Want it weighed against everything else?</h3>
        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: T.muted, lineHeight: 1.65 }}>Sanchayapatra is the anchor — but the right mix depends on your amount and risk. Build a full plan in the Invest tool.</p>
        <button className="fd-cta" onClick={() => nav("/invest")} style={{ ...cta, width: "auto", padding: "14px 28px" }}>Open the Invest planner →</button>
      </div>

      <RelatedLinks links={[
        { label: "Where to invest", path: "/invest" },
        { label: "Savings & DPS planner", path: "/save" },
        { label: "Loan EMI calculator", path: "/borrow" },
        { label: "Money Blueprint", path: "/blueprint" },
      ]} />
      <TabDisclaimer />
    </>
  );
}

/* ============================================================
   COMPARISON HUB — coming-soon stubs (full build is a future sprint).
   Pattern: Paisabazaar-style card grid + multi-select "Compare".
   ============================================================ */
const WHATSAPP_LINK = "https://wa.me/8801720408431?text=" + encodeURIComponent("Hi FinDesh — please notify me when the comparison tool launches.");
const COMPARE_META = {
  "credit-cards": { icon: "💳", h1: "Compare Credit Cards in Bangladesh", what: "Annual fees, interest rates, lounge access, cashback and the best card for how you actually spend — side by side, no sales calls.", filters: ["No Annual Fee", "Best for Online Shopping", "Cashback", "Lifetime Free", "Travel"] },
  "savings": { icon: "🏦", h1: "Compare Savings Accounts in Bangladesh", what: "Interest rates, minimum balances, fees and digital features across banks — so you can see at a glance where your money works hardest.", filters: ["Highest Rate", "Zero Balance", "Best Digital App", "Best for DPS Holders", "Islamic"] },
  "loans": { icon: "🤝", h1: "Compare Loans in Bangladesh", what: "Personal, home and car loan rates, processing fees and tenures across strong lenders — the full picture before you ever walk into a branch.", filters: ["Lowest Rate", "Personal", "Home", "Car", "Islamic"] },
};

function ComingSoonPage({ kind }) {
  const nav = useNav();
  const m = COMPARE_META[kind] || COMPARE_META["credit-cards"];
  return (
    <>
      <div style={{ textAlign: "center", padding: "44px 0 18px" }}>
        <div className="fd-up" style={pill}>{m.icon} Coming soon</div>
        <h1 className="fd-up fd-up-1" style={{ ...h1, fontSize: "clamp(26px,5.5vw,40px)" }}>{m.h1}</h1>
        <p className="fd-up fd-up-2" style={sub}>{m.what}</p>
      </div>

      {/* interest capture — audience ownership, no email */}
      <div className="fd-up" style={{ ...card, textAlign: "center", padding: "26px 22px", marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, color: "#fff" }}>Want first access?</h3>
        <p style={{ margin: "0 auto 16px", fontSize: 13.5, color: T.muted, lineHeight: 1.65, maxWidth: 420 }}>We're building this now. Tap below and we'll message you on WhatsApp the moment it's live — no email, no spam, just a one-time heads-up.</p>
        <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="fd-cta" style={{ ...cta, display: "inline-block", width: "auto", padding: "14px 26px", textDecoration: "none", background: "linear-gradient(135deg,#25D366,#128C7E)" }}>💬 Notify me on WhatsApp</a>
      </div>

      {/* a peek at the planned layout (Paisabazaar-style card grid + compare) */}
      <SectionHead title="What it'll look like" hint="Preview · card grid + compare" />
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {m.filters.map(f => <span key={f} className="fd-chip" style={{ ...chip(false), cursor: "default", opacity: 0.7 }}>{f}</span>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, opacity: 0.55, pointerEvents: "none" }}>
        {[1, 2].map(n => (
          <div key={n} style={{ background: T.glass, border: `1px solid ${T.border}`, borderRadius: 16, padding: "16px 17px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ width: 90, height: 13, borderRadius: 5, background: "rgba(148,180,255,0.18)" }} />
              <span style={{ fontSize: 11.5, color: T.muted }}>☐ Compare</span>
            </div>
            <div style={{ width: "70%", height: 10, borderRadius: 5, background: "rgba(148,180,255,0.12)", marginBottom: 8 }} />
            <div style={{ width: "55%", height: 10, borderRadius: 5, background: "rgba(148,180,255,0.10)", marginBottom: 14 }} />
            <div style={{ height: 34, borderRadius: 9, background: T.accentSoft, border: `1px solid ${T.accentBorder}` }} />
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: T.faint, lineHeight: 1.7, margin: "16px 4px 0" }}>You'll filter by what matters to you, tick a few products, and see them side-by-side in a clean table — with a plain-English “why we'd pick this” note. Free, like every FinDesh tool.</p>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button className="fd-chip" onClick={() => nav("/invest")} style={{ ...chip(false), padding: "11px 20px", fontSize: 13 }}>← Back to the free tools</button>
      </div>
      <TabDisclaimer />
    </>
  );
}

/* ============================================================
   ROUTING + SEO — main tabs + the standalone Sanchayapatra page.
   Native History API (no router dep). Netlify rewrites /* → index.html,
   so deep links resolve; this layer sets active tab + per-page metadata.
   ============================================================ */
const SITE = "https://findeshai.com";
const DEFAULT_DESC = "Free AI-powered investment advice, Sanchayapatra & FDR rates, DPS savings plans and loan EMI calculator for Bangladesh. Grow your money with FinDesh AI.";

const ROUTES = {
  "/": {
    tab: "invest",
    title: "FinDesh AI — Bangladesh's First AI Personal Finance & Investment Platform",
    desc: DEFAULT_DESC,
  },
  "/invest": {
    tab: "invest",
    title: "Where to Invest in Bangladesh (2026) — AI Investment Planner | FinDesh AI",
    desc: "Get a personalised Bangladesh investment plan in seconds — Sanchayapatra, FDR, mutual funds, DSE blue-chips and gold, with verified 2026 rates and your risk level.",
    h1: "Where to invest in Bangladesh",
    sub: "Tell us how much you have and your risk comfort. Get a clear, Bangladesh-specific investment plan in seconds — with 2026 rates.",
  },
  "/save": {
    tab: "save",
    title: "DPS Calculator Bangladesh 2026 — Monthly Savings Planner | FinDesh AI",
    desc: "Plan your monthly savings and compare the best DPS rates in Bangladesh (up to ~11%). See exactly what your DPS grows to at maturity with FinDesh AI.",
  },
  "/borrow": {
    tab: "borrow",
    title: "Loan EMI Calculator Bangladesh 2026 — Compare Bank Rates | FinDesh AI",
    desc: "Free loan EMI calculator for Bangladesh plus a side-by-side comparison of personal, home and car loan rates from strong banks (2026).",
  },
  "/blueprint": {
    tab: "blueprint",
    title: "BD Money Blueprint — A Bangladesh Personal Finance Guide | FinDesh AI",
    desc: "A conscious spending plan and money guide for Bangladeshi earners, rebuilt for BD banks, BD instruments and Dhaka's cost of living — plus free planning tools.",
  },
  "/sanchayapatra": {
    tab: "invest", view: "sanchayapatra",
    title: "Sanchayapatra Rate 2026, Limits & Profit Calculator | FinDesh AI",
    desc: "Current Sanchayapatra rates (11.82–11.98%), individual vs joint investment limits, the combined-purchase rule and a free profit calculator for Bangladesh.",
  },
  "/compare/credit-cards": {
    tab: null, view: "compare", kind: "credit-cards", noindex: true,
    title: "Compare Credit Cards in Bangladesh (Coming Soon) | FinDesh AI",
    desc: "A free, side-by-side credit card comparison for Bangladesh is coming to FinDesh AI — fees, rates and the best card for your spending. Get notified.",
  },
  "/compare/savings": {
    tab: null, view: "compare", kind: "savings", noindex: true,
    title: "Compare Savings Accounts in Bangladesh (Coming Soon) | FinDesh AI",
    desc: "A free, side-by-side savings account comparison for Bangladesh is coming to FinDesh AI — rates, fees and the best account for you. Get notified.",
  },
  "/compare/loans": {
    tab: null, view: "compare", kind: "loans", noindex: true,
    title: "Compare Loans in Bangladesh (Coming Soon) | FinDesh AI",
    desc: "A free, side-by-side loan comparison for Bangladesh is coming to FinDesh AI — personal, home and car loan rates and terms in one place. Get notified.",
  },
};

const TAB_PATH = { invest: "/invest", save: "/save", borrow: "/borrow", blueprint: "/blueprint" };

function resolveRoute(pathname) {
  const clean = (pathname || "/").replace(/\/+$/, "") || "/";
  return ROUTES[clean] ? clean : (ROUTES[clean.toLowerCase()] ? clean.toLowerCase() : "/");
}

const NavCtx = createContext(() => {});
function useNav() { return useContext(NavCtx); }

/* set/replace a <meta> or <link> attribute by selector */
function setTag(selector, attr, value) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

let seoInitialized = false;
function applySEO(routeKey) {
  const r = ROUTES[routeKey] || ROUTES["/"];
  const url = SITE + (routeKey === "/" ? "/" : routeKey);
  document.title = r.title;
  setTag('meta[name="description"]', "content", r.desc);
  setTag('link[rel="canonical"]', "href", url);
  setTag('meta[property="og:url"]', "content", url);
  setTag('meta[property="og:title"]', "content", r.title);
  setTag('meta[property="og:description"]', "content", r.desc);
  setTag('meta[name="twitter:title"]', "content", r.title);
  setTag('meta[name="twitter:description"]', "content", r.desc);
  setTag('meta[name="robots"]', "content", r.noindex ? "noindex, follow" : "index, follow");
  /* Skip the first call (GA4 config + GTM already fire a page_view on load);
     fire on every subsequent SPA route change so per-page tracking still works. */
  if (seoInitialized) {
    if (window.dataLayer) window.dataLayer.push({ event: "page_view", page_path: routeKey, page_title: r.title, page_location: url });
    if (typeof window.gtag === "function") window.gtag("event", "page_view", { page_path: routeKey, page_title: r.title, page_location: url });
  }
  seoInitialized = true;
}

/* Internal SEO links between related tools */
function RelatedLinks({ links }) {
  const nav = useNav();
  if (!links || !links.length) return null;
  return (
    <div style={{ marginTop: 26, paddingTop: 18, borderTop: `1px solid ${T.borderSoft}`, position: "relative", zIndex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.faint, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>Related tools</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {links.map(l => (
          <a key={l.path} href={l.path} className="fd-chip" onClick={e => { e.preventDefault(); nav(l.path); }}
            style={{ textDecoration: "none", padding: "9px 14px", fontSize: 13, fontWeight: 600, borderRadius: 10, border: `1px solid ${T.accentBorder}`, background: T.accentSoft, color: "#8AC2FF" }}>
            {l.label} →
          </a>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   ROOT — navigation shell + router
   ============================================================ */
export default function App() {
  const [routeKey, setRouteKey] = useState(() => (typeof window !== "undefined" ? resolveRoute(window.location.pathname) : "/"));
  const route = ROUTES[routeKey] || ROUTES["/"];
  const page = route.tab;

  const navigate = (path) => {
    const key = resolveRoute(path);
    if (key !== window.location.pathname) window.history.pushState({}, "", key === "/" ? "/" : key);
    setRouteKey(key);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const onPop = () => setRouteKey(resolveRoute(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => { applySEO(routeKey); }, [routeKey]);

  const [menuOpen, setMenuOpen] = useState(false);
  const go = (path) => { setMenuOpen(false); navigate(path); };

  const tabs = [
    { id: "invest", label: "Invest", icon: "📈" },
    { id: "save", label: "Save", icon: "💰" },
    { id: "borrow", label: "Borrow", icon: "🏦" },
    { id: "blueprint", label: "Blueprint", icon: "🗺️" },
  ];
  const menuGroups = [
    { heading: "Tools", items: [
      { label: "Invest", icon: "📈", path: "/invest" },
      { label: "Save", icon: "💰", path: "/save" },
      { label: "Borrow", icon: "🏦", path: "/borrow" },
      { label: "Blueprint", icon: "🗺️", path: "/blueprint" },
      { label: "Sanchayapatra", icon: "🏛️", path: "/sanchayapatra" },
    ] },
    { heading: "Compare · coming soon", items: [
      { label: "Compare Credit Cards", icon: "💳", path: "/compare/credit-cards", soon: true },
      { label: "Compare Savings Accounts", icon: "🏦", path: "/compare/savings", soon: true },
      { label: "Compare Loans", icon: "🤝", path: "/compare/loans", soon: true },
    ] },
  ];

  return (
    <NavCtx.Provider value={navigate}>
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 80% 50% at 50% -10%, #0B1E3D 0%, ${T.bg} 55%)`, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: T.text, position: "relative" }}>
      <style>{GLOBAL_CSS}</style>
      <Orbs />

      <nav style={{ background: "rgba(4,8,15,0.75)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px 0 22px", position: "sticky", top: 0, zIndex: 50, borderBottom: `1px solid ${T.borderSoft}` }}>
        <a href="/" onClick={e => { e.preventDefault(); go("/"); }} style={{ textDecoration: "none" }}><Logo size={30} /></a>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="fd-hide-sm" style={{ color: T.muted, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, animation: "fdPulse 2.2s ease-in-out infinite" }} /> Live BD rates · {LAST_UPDATED}
          </span>
          <button aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)} style={{ width: 40, height: 40, borderRadius: 11, cursor: "pointer", border: `1px solid ${menuOpen ? T.accentBorder : T.borderSoft}`, background: menuOpen ? T.accentSoft : "rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, fontFamily: "inherit" }}>
            <span style={{ width: 17, height: 2, borderRadius: 2, background: menuOpen ? T.accent : "#C9D8F0", transition: "transform .2s", transform: menuOpen ? "translateY(6px) rotate(45deg)" : "none" }} />
            <span style={{ width: 17, height: 2, borderRadius: 2, background: menuOpen ? T.accent : "#C9D8F0", opacity: menuOpen ? 0 : 1, transition: "opacity .15s" }} />
            <span style={{ width: 17, height: 2, borderRadius: 2, background: menuOpen ? T.accent : "#C9D8F0", transition: "transform .2s", transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "none" }} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 55, background: "rgba(2,5,11,0.5)", backdropFilter: "blur(2px)" }} />
          <div className="fd-up" style={{ position: "fixed", top: 70, right: 14, zIndex: 60, width: 268, maxWidth: "calc(100vw - 28px)", background: "rgba(8,14,26,0.98)", border: `1px solid ${T.border}`, borderRadius: 16, padding: "10px", boxShadow: "0 24px 70px rgba(0,0,0,0.6)", backdropFilter: "blur(20px)" }}>
            {menuGroups.map((grp, gi) => (
              <div key={gi} style={{ marginTop: gi ? 8 : 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: T.faint, letterSpacing: ".09em", textTransform: "uppercase", padding: "8px 10px 6px" }}>{grp.heading}</div>
                {grp.items.map(it => {
                  const active = resolveRoute(it.path) === routeKey;
                  return (
                    <a key={it.path} href={it.path} onClick={e => { e.preventDefault(); go(it.path); }} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 10px", borderRadius: 10, textDecoration: "none", background: active ? T.accentSoft : "transparent", color: active ? "#fff" : "#C9D8F0", fontSize: 14, fontWeight: 600 }}>
                      <span style={{ fontSize: 16 }}>{it.icon}</span>
                      <span style={{ flex: 1 }}>{it.label}</span>
                      {it.soon && <span style={{ fontSize: 9.5, fontWeight: 800, color: T.amber, background: "rgba(255,180,84,0.12)", border: "1px solid rgba(255,180,84,0.3)", borderRadius: 20, padding: "2px 7px", letterSpacing: ".04em" }}>SOON</span>}
                    </a>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ position: "sticky", top: 62, zIndex: 40, background: "rgba(4,8,15,0.7)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: `1px solid ${T.borderSoft}`, padding: "10px 12px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: 4 }}>
          {tabs.map(t => (
            <button key={t.id} className="fd-tab" onClick={() => navigate(TAB_PATH[t.id])} style={{
              flex: 1, padding: "9px 4px", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
              background: page === t.id ? "linear-gradient(135deg, rgba(79,158,255,0.28), rgba(79,158,255,0.12))" : "transparent",
              color: page === t.id ? "#fff" : T.muted, fontWeight: page === t.id ? 800 : 600, fontSize: 12.5,
              boxShadow: page === t.id ? "inset 0 0 0 1px rgba(79,158,255,0.45), 0 4px 16px rgba(79,158,255,0.15)" : "none",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 16px 40px", position: "relative", zIndex: 1 }}>
        {route.view === "sanchayapatra" ? <SanchayapatraPage />
          : route.view === "compare" ? <ComingSoonPage kind={route.kind} />
          : page === "invest" ? <InvestPage seoHead={route.h1 ? { h1: route.h1, sub: route.sub } : null} />
          : page === "save" ? <SavingsPage seoHead={route.h1 ? { h1: route.h1, sub: route.sub } : null} />
          : page === "borrow" ? <BorrowPage initialType={route.preset?.type} />
          : page === "blueprint" ? <BlueprintPage />
          : <InvestPage seoHead={null} />}
      </div>

      <footer style={{ borderTop: `1px solid ${T.borderSoft}`, marginTop: 60, padding: "32px 20px 40px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><Logo size={24} /></div>
        <p style={{ fontSize: 12, color: T.faint, maxWidth: 540, margin: "0 auto 12px", lineHeight: 1.7 }}>
          FinDesh AI provides educational information on Bangladeshi financial products, not licensed investment advice. Rates verified {LAST_UPDATED} and change — always confirm with the institution before investing or borrowing.
        </p>
        <div style={{ fontSize: 12, color: T.faint, fontWeight: 500 }}>
          Built in Dhaka 🇧🇩 · <a className="fd-link" href="https://findeshai.com" style={{ color: T.accent, textDecoration: "none", fontWeight: 600 }}>findeshai.com</a> · © 2026 FinDesh AI
        </div>
      </footer>
    </div>
    </NavCtx.Provider>
  );
}

/* ---------- shared styles (dark) ---------- */
const gradText = { background: "linear-gradient(95deg, #4F9EFF 10%, #8AC2FF 60%, #00D68F 110%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };
const pill = { fontSize: 12, fontWeight: 700, color: "#8AC2FF", background: "rgba(79,158,255,0.10)", border: "1px solid rgba(79,158,255,0.30)", borderRadius: 20, padding: "6px 16px", marginBottom: 20, letterSpacing: ".02em", display: "inline-block", backdropFilter: "blur(10px)" };
const h1 = { fontSize: "clamp(30px,6.5vw,48px)", fontWeight: 900, margin: "0 0 14px", lineHeight: 1.08, letterSpacing: "-0.035em", color: "#fff" };
const sub = { fontSize: 16, color: "#8A9BB8", margin: "0 auto", maxWidth: 500, lineHeight: 1.6 };
const card = { background: T.glass, borderRadius: 22, padding: "28px 24px", border: `1px solid ${T.border}`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", position: "relative", zIndex: 1 };
const lbl = { display: "block", fontWeight: 700, fontSize: 11.5, letterSpacing: ".08em", color: "#8A9BB8", marginBottom: 10, textTransform: "uppercase" };
const taka = { position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", fontSize: 22, color: "#5C6E8C", fontWeight: 600, zIndex: 1 };
const bigInput = { width: "100%", boxSizing: "border-box", padding: "17px 16px 17px 44px", fontSize: 24, fontWeight: 800, color: "#fff", border: "1.5px solid rgba(148,180,255,0.18)", borderRadius: 14, outline: "none", background: "rgba(8,18,36,0.65)", fontFamily: "inherit", caretColor: "#4F9EFF" };
const inputHint = { position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: "#4F9EFF" };
const errStyle = { color: "#FF6B6B", fontSize: 13, margin: "0 0 14px", fontWeight: 600 };
const cta = { width: "100%", padding: "17px", fontSize: 16, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg, #4F9EFF, #2563EB)", border: "none", borderRadius: 14, cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em", boxShadow: "0 8px 28px rgba(79,158,255,0.3)" };
const inflationNote = { marginTop: 20, background: "rgba(255,180,84,0.07)", border: "1px solid rgba(255,180,84,0.22)", borderRadius: 13, padding: "13px 15px", fontSize: 12.5, color: "#FFCE8A", lineHeight: 1.6, position: "relative", zIndex: 1 };
const stepDot = { width: 24, height: 24, flexShrink: 0, borderRadius: "50%", background: "rgba(79,158,255,0.16)", border: "1px solid rgba(79,158,255,0.42)", color: "#8AC2FF", fontSize: 12.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" };
function chip(active) { return { flex: 1, minWidth: 64, padding: "10px 6px", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", border: `1px solid ${active ? "rgba(79,158,255,0.6)" : "rgba(148,180,255,0.14)"}`, background: active ? "rgba(79,158,255,0.16)" : "rgba(255,255,255,0.025)", color: active ? "#8AC2FF" : "#8A9BB8", borderRadius: 10, cursor: "pointer" }; }
function riskBtn(active, c) { return { flex: 1, padding: "15px 6px", borderRadius: 14, cursor: "pointer", textAlign: "center", fontFamily: "inherit", border: active ? `1.5px solid ${c.border}` : "1.5px solid rgba(148,180,255,0.14)", background: active ? c.bg : "rgba(255,255,255,0.025)", boxShadow: active ? `0 0 24px ${c.color}22` : "none" }; }
