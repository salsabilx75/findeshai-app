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
.fd-item { transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease, background .22s ease; touch-action: manipulation; }
@media (hover: hover) { .fd-item:hover { transform: translateY(-3px); border-color: rgba(79,158,255,0.35) !important; box-shadow: 0 14px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(79,158,255,0.1); } }
.fd-cta { transition: transform .18s ease, box-shadow .18s ease, filter .18s ease; }
.fd-cta:hover { filter: brightness(1.12); transform: translateY(-2px); box-shadow: 0 12px 36px rgba(79,158,255,0.42); }
.fd-cta:active { transform: translateY(0) scale(.985); }
.fd-chip { transition: border-color .15s ease, background .15s ease, color .15s ease, transform .15s ease; }
.fd-chip:hover { border-color: rgba(79,158,255,0.5) !important; color: #EAF1FC !important; transform: translateY(-1px); }
.fd-input { transition: border-color .2s ease, box-shadow .2s ease; }
.fd-input:focus { border-color: rgba(79,158,255,0.65) !important; box-shadow: 0 0 0 4px rgba(79,158,255,0.14); }
.fd-input::placeholder { color: #3D4D68; }
.fd-tab { transition: color .18s ease, background .18s ease; touch-action: manipulation; }
@media (hover: hover) { .fd-tab:hover { color: #C9D8F0 !important; } }
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

  const [pdfLoading, setPdfLoading] = useState(false);

  const run = () => {
    if (!num || num < 500) return setErr("Please enter at least ৳500.");
    if (!risk) return setErr("Please choose your risk level.");
    setErr(""); setSubmitted(true);
    setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };
  const matched = submitted && risk ? INSTRUMENTS.filter(i => i.risk.includes(risk) && i.min <= num).sort((a, b) => a.rate - b.rate) : [];

  const riskLabel = { low: "Conservative", medium: "Balanced", high: "Aggressive" }[risk] || "";
  const downloadPlanPDF = async () => {
    taxTrack("invest_pdf_download_started", { risk });
    setPdfLoading(true);
    try {
      const alloc = ALLOCATION[risk] || [];
      const { doc, y: y0 } = await newPdfDoc("Personal Investment Plan", riskLabel + " profile   ·   Investable amount: " + bdt(num));
      let y = y0;

      y = pdfSection(doc, y, "1.  SUGGESTED ASSET ALLOCATION");
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(120, 134, 156);
      doc.text("ASSET CLASS", PDF.L + 8, y); doc.text("WEIGHT", 360, y, { align: "right" }); doc.text("AMOUNT", PDF.R - 8, y, { align: "right" });
      y += 6; y = pdfRule(doc, y);
      alloc.forEach(a => {
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(70, 84, 106);
        doc.text(a.cat, PDF.L + 8, y);
        doc.text(a.pct + "%", 360, y, { align: "right" });
        doc.text(bdt(num * a.pct / 100), PDF.R - 8, y, { align: "right" });
        y += 15.5;
      });
      y = pdfRule(doc, y);
      y = pdfTotal(doc, y, "Total to Invest", bdt(num));

      y = pdfBreak(doc, y, 200);
      y = pdfSection(doc, y, "2.  MATCHED INSTRUMENTS (LOW TO HIGH RISK)");
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(120, 134, 156);
      doc.text("INSTRUMENT", PDF.L + 8, y); doc.text("RETURN", 330, y, { align: "right" });
      doc.text("HORIZON", 430, y, { align: "right" }); doc.text("VALUE IN 5 YRS*", PDF.R - 8, y, { align: "right" });
      y += 6; y = pdfRule(doc, y);
      matched.slice(0, 12).forEach(i => {
        y = pdfBreak(doc, y, 40);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(70, 84, 106);
        doc.text(doc.splitTextToSize(i.name, 250)[0], PDF.L + 8, y);
        doc.text(i.rateLabel, 330, y, { align: "right" });
        doc.text(i.horizon, 430, y, { align: "right" });
        doc.text(bdt(num * Math.pow(1 + i.rate / 100, 5)), PDF.R - 8, y, { align: "right" });
        y += 15.5;
      });
      y += 2;
      y = pdfNote(doc, y, "*Illustrative value if the entire amount were placed in that single instrument and returns held steady for five years, compounded annually. Actual returns vary; rates are not guaranteed except where explicitly government-backed.");

      y = pdfBreak(doc, y, 110);
      y = pdfSection(doc, y, "3.  WHY THIS MATTERS");
      y = pdfNote(doc, y, "Bangladesh inflation is running at approximately " + INFLATION + "% (early 2026). Any instrument returning less than that is quietly reducing your purchasing power — a standard savings account paying 3-5% loses you real money every year. Every option listed above is shown with its published rate so you can compare against that " + INFLATION + "% benchmark.", [20, 120, 90]);
      y = pdfRow(doc, y, "Inflation benchmark to beat", INFLATION + "%", { bold: true });

      pdfFooter(doc, "Prepared by FinDesh AI (findeshai.com) for personal planning purposes only. Rates shown are those published by issuers and were current at the time of generation; they change and should be reconfirmed with the bank, broker or National Savings office before you invest. This is not investment advice and FinDesh AI is not a licensed investment adviser. Consider your own circumstances, or consult a qualified professional, before making any investment.");
      doc.save("FinDesh-Investment-Plan-" + riskLabel + ".pdf");
      taxTrack("invest_pdf_downloaded", { risk });
    } catch (e) { setErr("Couldn't generate the PDF just now — please try again."); }
    finally { setPdfLoading(false); }
  };
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

          <div style={{ marginTop: 18 }}>
            <button className="fd-cta" onClick={downloadPlanPDF} disabled={pdfLoading} style={{ ...cta, opacity: pdfLoading ? 0.7 : 1, touchAction: "manipulation" }}>{pdfLoading ? <>Preparing <span className="fd-spin" /></> : "📄 Download my investment plan (PDF)"}</button>
            <p style={{ margin: "8px 0 0", fontSize: 11.5, color: T.faint }}>Your allocation, matched instruments and 5-year projections — one page you can save or share with your bank.</p>
          </div>
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

  const [pdfLoading, setPdfLoading] = useState(false);
  const downloadLoanPDF = async () => {
    taxTrack("borrow_pdf_download_started");
    setPdfLoading(true);
    try {
      const { doc, y: y0 } = await newPdfDoc("Loan Repayment Plan", bdt(P) + "  ·  " + R + "% p.a.  ·  " + years + " year" + (years > 1 ? "s" : ""));
      let y = y0;

      y = pdfSection(doc, y, "1.  LOAN SUMMARY");
      y = pdfRow(doc, y, "Loan amount (principal)", bdt(P));
      y = pdfRow(doc, y, "Annual interest rate", R + "%");
      y = pdfRow(doc, y, "Tenure", years + " years  (" + years * 12 + " instalments)");
      y = pdfRule(doc, y);
      y = pdfTotal(doc, y, "Monthly EMI", bdt(emiV));

      y = pdfSection(doc, y, "2.  TOTAL COST OF THIS LOAN");
      y = pdfRow(doc, y, "Total principal repaid", bdt(P));
      y = pdfRow(doc, y, "Total interest paid", bdt(totalInterest), { note: interestPct.toFixed(0) + "% of the amount borrowed", color: [176, 116, 20] });
      y = pdfRule(doc, y);
      y = pdfTotal(doc, y, "Total Amount Repayable", bdt(totalPaid), [253, 238, 226]);

      if (schedule.length) {
        y = pdfBreak(doc, y, 200);
        y = pdfSection(doc, y, "3.  YEAR-BY-YEAR AMORTISATION SCHEDULE");
        doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(120, 134, 156);
        doc.text("YEAR", PDF.L + 8, y); doc.text("PRINCIPAL PAID", 300, y, { align: "right" });
        doc.text("INTEREST PAID", 420, y, { align: "right" }); doc.text("BALANCE", PDF.R - 8, y, { align: "right" });
        y += 6; y = pdfRule(doc, y);
        schedule.forEach(s => {
          y = pdfBreak(doc, y, 40);
          doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(70, 84, 106);
          doc.text("Year " + s.y, PDF.L + 8, y);
          doc.text(bdt(s.pPaid), 300, y, { align: "right" });
          doc.text(bdt(s.iPaid), 420, y, { align: "right" });
          doc.text(bdt(s.bal), PDF.R - 8, y, { align: "right" });
          y += 15.5;
        });
        y = pdfRule(doc, y);
        y = pdfRow(doc, y, "Totals", bdt(totalPaid), { bold: true });
      }

      y = pdfBreak(doc, y, 120);
      y = pdfSection(doc, y, "4.  AFFORDABILITY CHECK");
      y = pdfRow(doc, y, "Monthly EMI", bdt(emiV));
      y = pdfRow(doc, y, "Suggested minimum monthly income", bdt(emiV / 0.4), { note: "all EMIs under 40%", bold: true });
      y += 4;
      y = pdfNote(doc, y, localInsight());

      pdfFooter(doc, "Prepared by FinDesh AI (findeshai.com) for personal planning purposes only. EMI is calculated on a standard reducing-balance basis using the rate and tenure entered by the user. Your bank's actual offer will differ: processing fees, insurance, stamp duty, early-settlement charges and variable-rate resets are not included here, and the rate you are quoted depends on your credit assessment. Confirm all figures with the lender before signing. This is not financial advice.");
      doc.save("FinDesh-Loan-Plan-" + Math.round(P / 1000) + "k-" + years + "yr.pdf");
      taxTrack("borrow_pdf_downloaded");
    } catch (e) { /* silent — button re-enables */ }
    finally { setPdfLoading(false); }
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

          <button className="fd-cta" onClick={downloadLoanPDF} disabled={pdfLoading} style={{ ...cta, marginBottom: 10, opacity: pdfLoading ? 0.7 : 1, touchAction: "manipulation" }}>
            {pdfLoading ? <>Preparing <span className="fd-spin" /></> : "📄 Download my loan plan (PDF)"}
          </button>
          <p style={{ margin: "0 0 16px", fontSize: 11.5, color: T.faint }}>EMI, total interest and the full year-by-year repayment schedule — useful to compare against what a bank quotes you.</p>

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
   INCOME TAX — FY 2026-27 (AY 2026-27) standalone calculator.
   Rules verified June 2026 vs Finance Act 2026 (PwC / Jural Acuity / Ramco):
   general threshold ৳4,00,000; 5% slab abolished (first ৳3L above threshold
   at 10%); standard deduction = min(⅓ salary, ৳5L); rebate = min(10% of
   investment, 3% of taxable income, ৳7.5L); minimum tax ৳5,000 (৳1,000 for a
   new filer under ৳4.5L). Deterministic — no Gemini in the calc. Do NOT change
   any number without founder sign-off + a cited source.

   MINIMUM-TAX RULE (founder-confirmed, Jul 2026): the ৳5,000 / ৳1,000 floor
   applies to any filer whose TOTAL income exceeds the tax-free limit, even when
   the ⅓ salary exemption drops taxable income below the threshold. Only someone
   whose total income is within the tax-free limit pays ৳0.

   Verified test cases (§13) — all pass with the rule above (FY 2026-27):
     1. General, salary ৳5,00,000 ............................ net ৳5,000  (floor)
     2. General, salary ৳12,00,000 .......................... net ৳45,000
     3. Woman, ৳10L + ৳1L invest + ৳20k TDS .. net ৳11,667, refund ৳8,333
     4. General, ৳30L + ৳8L invest + ৳2.5L TDS . net ৳3,40,000, balance ৳90k
     5. First-time filer, salary ৳4,20,000 .................. net ৳1,000  (floor)

   TWO FISCAL YEARS (added Jul 2026, founder request): people file FY 2025-26
   during Jul–Nov 2026, so that is the DEFAULT. The rule sets differ in three
   ways that matter — threshold ৳3.75L vs ৳4L, rebate 15% vs 10%, ceiling ৳10L
   vs ৳7.5L. FY 2025-26 is cross-checked against a real corporate payroll
   computation sheet (APM Global Logistics, Jun 2026) and reproduces its
   ৳60,933.27 gross tax on ৳8,81,221.81 taxable income exactly.
   ============================================================ */
const NBR_ERETURN_URL = "https://etaxnbr.gov.bd/";

/* FY 2025-26 (AY 2026-27) — the year being FILED in Jul–Nov 2026. Verified Jul 2026
   against Rashel's Law Desk, Prothom Alo (budget report), PwC and a real corporate
   payroll computation sheet (APM Global Logistics, Jun 2026), which reproduces the
   ৳3,75,000 threshold and 10/15/20/25/30 slabs exactly. Rebate here is 15% of
   investment (capped 3% of taxable income, ৳1,00,00,000 investment ceiling) — the
   rate was CUT to 10% only from FY 2026-27, which is the single biggest reason a
   FY 2025-26 payslip won't match a FY 2026-27 calculation.
   Minimum tax ৳5,000 = Dhaka North/South + Chattogram city corporations (this app's
   core audience). Outside those it is ৳4,000 (other city corps) / ৳3,000. */
const FY_2025_26 = {
  label: "FY 2025-26", ay: "Assessment Year 2026-27", filedIn: "Filed July–November 2026",
  thresholds: { general: 375000, woman: 425000, senior_65plus: 425000, disability: 500000, third_gender: 500000, freedom_fighter: 525000 },
  slabs: [[300000, 0.10], [400000, 0.15], [500000, 0.20], [2000000, 0.25], [Infinity, 0.30]],
  salary_deduction: { rate: 1 / 3, cap: 500000 },
  rebate: { rate: 0.15, income_cap_rate: 0.03, absolute_cap: 1000000 },
  minimum_tax: { regular: 5000, first_time_under_450k: 1000 },
  earlyFilingRebate: false,
};
const FY_2026_27 = {
  label: "FY 2026-27", ay: "Assessment Year 2027-28", filedIn: "Filed July–November 2027",
  thresholds: { general: 400000, woman: 450000, senior_65plus: 450000, disability: 525000, third_gender: 525000, freedom_fighter: 550000 },
  slabs: [[300000, 0.10], [400000, 0.15], [500000, 0.20], [2000000, 0.25], [Infinity, 0.30]],
  salary_deduction: { rate: 1 / 3, cap: 500000 },
  rebate: { rate: 0.10, income_cap_rate: 0.03, absolute_cap: 750000 },
  minimum_tax: { regular: 5000, first_time_under_450k: 1000 },
  earlyFilingRebate: true,
};
const FY_RULES = { "2025-26": FY_2025_26, "2026-27": FY_2026_27 };
const FY_LIST = ["2025-26", "2026-27"];
const DEFAULT_FY = "2025-26"; // the return people are actually filing right now
const rulesFor = fy => FY_RULES[fy] || FY_RULES[DEFAULT_FY];
const TAX_CATEGORIES = [
  { id: "general", label: "General" },
  { id: "woman", label: "Woman" },
  { id: "senior_65plus", label: "Senior 65+" },
  { id: "disability", label: "Disabled" },
  { id: "third_gender", label: "Third gender" },
  { id: "freedom_fighter", label: "Freedom fighter" },
];
/* Strips commas/৳/spaces but PRESERVES the decimal point — payslips quote paisa
   ("1,321,832.72") and dropping the dot silently multiplied the figure by 100. */
const digits = v => {
  if (typeof v === "number") return isFinite(v) && v > 0 ? v : 0;
  const cleaned = String(v).replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  const n = Number(parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned);
  return isFinite(n) && n > 0 ? n : 0;
};

function calcIncomeTax({ gross, other, investment, tds, category, firstTime, fy = DEFAULT_FY }) {
  const R = rulesFor(fy);
  gross = digits(gross); other = digits(other); investment = digits(investment); tds = digits(tds);
  const cat = R.thresholds[category] != null ? category : "general";
  const threshold = R.thresholds[cat];
  const std = Math.min(gross * R.salary_deduction.rate, R.salary_deduction.cap);
  const taxableSalary = Math.max(gross - std, 0);
  const taxable = taxableSalary + other;
  const grossTotal = gross + other; // total income before the ⅓ salary exemption — the "are you a taxpayer / filer?" test
  const maxRebate = Math.min(R.rebate.income_cap_rate * taxable, R.rebate.absolute_cap);
  const optimumInvestment = maxRebate / R.rebate.rate; // FY26-27: 30% of taxable; FY25-26: 20%
  // Rebate is the LOWEST of these three — shown individually so the PDF can prove the working,
  // the way a corporate payroll computation sheet does.
  const rebateCandidates = [
    { label: (R.rebate.rate * 100) + "% of actual investment", value: R.rebate.rate * investment },
    { label: (R.rebate.income_cap_rate * 100) + "% of total taxable income", value: R.rebate.income_cap_rate * taxable },
    { label: "Statutory ceiling", value: R.rebate.absolute_cap },
  ];

  // Total income within the tax-free limit → genuinely no tax and no minimum tax.
  if (grossTotal <= threshold) {
    return { fy, rules: R, gross, std, taxableSalary, other, taxable, grossTotal, threshold, belowThreshold: true, slabTax: 0, rebate: 0, rebateCandidates, slabDetail: [],
      taxAfterRebate: 0, minTax: 0, minTaxApplied: false, rebateUseless: true, net: 0, tds, balance: 0, refund: tds, investment,
      optimumInvestment: 0, additionalTaxSaved: 0, investmentGap: 0, rebateState: "B" };
  }
  // Above the tax-free limit → a filer. Slab tax applies to income over the threshold (which can be ৳0 once the ⅓
  // salary exemption drops taxable income below the threshold), but the minimum-tax floor for filers still applies.
  let rem = Math.max(taxable - threshold, 0), slabTax = 0, lo = threshold;
  const slabDetail = [{ from: 0, to: threshold, width: threshold, rate: 0, tax: 0 }];
  for (const [width, rate] of R.slabs) {
    const amt = Math.min(rem, width); const t = amt * rate;
    slabDetail.push({ from: lo, to: width === Infinity ? Infinity : lo + width, width, rate, tax: t, applied: amt });
    slabTax += t; rem -= amt; lo = width === Infinity ? Infinity : lo + width;
    if (rem <= 0) break;
  }
  const rebate = Math.min(R.rebate.rate * investment, maxRebate);
  const taxAfterRebate = Math.max(slabTax - rebate, 0);
  const minTax = (firstTime && taxable < 450000) ? R.minimum_tax.first_time_under_450k : R.minimum_tax.regular;
  const net = Math.max(taxAfterRebate, minTax);
  const rebateUseless = slabTax <= minTax; // a rebate can't reduce net below the minimum-tax floor
  const balance = Math.max(net - tds, 0);
  const refund = Math.max(tds - net, 0);
  const netAtMax = Math.max(slabTax - maxRebate, minTax);
  const additionalTaxSaved = Math.max(net - netAtMax, 0);
  const investmentGap = Math.max(optimumInvestment - investment, 0);
  let rebateState;
  if (investment > optimumInvestment + 1) rebateState = "C";
  else if (additionalTaxSaved < 1 || investment >= optimumInvestment * 0.95) rebateState = "B";
  else rebateState = "A";
  return { fy, rules: R, gross, std, taxableSalary, other, taxable, grossTotal, threshold, belowThreshold: false, slabTax, rebate, rebateCandidates, slabDetail,
    taxAfterRebate, minTax, minTaxApplied: taxAfterRebate < minTax, rebateUseless, net, tds, balance, refund, investment,
    optimumInvestment, additionalTaxSaved, investmentGap, rebateState };
}
function slabRows(threshold, fy = DEFAULT_FY) {
  const rows = [{ from: 0, to: threshold, rate: 0 }]; let lo = threshold;
  for (const [width, rate] of rulesFor(fy).slabs) { const hi = width === Infinity ? Infinity : lo + width; rows.push({ from: lo, to: hi, rate }); lo = hi; }
  return rows;
}
/* ============================================================
   SHARED PDF KIT — used by the Income Tax, Invest and Borrow pages.
   jsPDF's built-in Helvetica has no ৳ glyph (it renders as a blank box), so
   every money figure goes out as "BDT 1,23,456" — the same convention a
   Bangladeshi corporate computation sheet uses. Loaded via dynamic import()
   so jsPDF stays out of the main bundle.
   ============================================================ */
const PDF = { L: 48, R: 547, W: 499 };
const bdt = n => "BDT " + Number(Math.round(n || 0)).toLocaleString("en-IN");
const bdt2 = n => "BDT " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pdfDate = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

async function newPdfDoc(title, subtitle) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const { L, R } = PDF;
  doc.setFillColor(10, 22, 40); doc.rect(0, 0, 595, 74, "F");           // navy brand band
  doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(255, 255, 255);
  doc.text("FinDesh", L, 34);
  const w = doc.getTextWidth("FinDesh");
  doc.setTextColor(79, 158, 255); doc.text(" AI", L + w, 34);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(150, 170, 200);
  doc.text("Bangladesh's AI-powered personal finance platform", L, 48);
  doc.setFontSize(8.5); doc.setTextColor(150, 170, 200);
  doc.text("Generated " + pdfDate(), R, 34, { align: "right" });
  doc.text("findeshai.com", R, 48, { align: "right" });
  let y = 104;
  doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(16, 28, 48);
  doc.text(title, 297.5, y, { align: "center" }); y += 17;
  if (subtitle) { doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(90, 110, 140); doc.text(subtitle, 297.5, y, { align: "center" }); y += 14; }
  return { doc, y: y + 10 };
}
/* Grey section heading bar, like the "Pay Description" band on a payroll sheet. */
function pdfSection(doc, y, label) {
  const { L, R } = PDF;
  doc.setFillColor(238, 242, 248); doc.rect(L, y - 11, R - L, 20, "F");
  doc.setDrawColor(205, 214, 228); doc.rect(L, y - 11, R - L, 20, "S");
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(30, 45, 70);
  doc.text(label, L + 8, y + 3);
  return y + 26;
}
/* One label/value line. opts: bold, indent, note (small grey middle column), color */
function pdfRow(doc, y, label, value, opts = {}) {
  const { L, R } = PDF;
  doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  doc.setFontSize(opts.bold ? 10.5 : 10);
  const c = opts.color || (opts.bold ? [16, 28, 48] : [70, 84, 106]);
  doc.setTextColor(c[0], c[1], c[2]);
  doc.text(label, L + 8 + (opts.indent || 0), y);
  // Note sits in its own column, right-aligned so it can never run into the amount.
  if (opts.note) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.setTextColor(146, 158, 178);
    doc.text(String(opts.note), 430, y, { align: "right" });
  }
  doc.setFont("helvetica", opts.bold ? "bold" : "normal"); doc.setFontSize(opts.bold ? 10.5 : 10);
  doc.setTextColor(c[0], c[1], c[2]);
  if (value != null) doc.text(String(value), R - 8, y, { align: "right" });
  return y + (opts.bold ? 18 : 15.5);
}
function pdfRule(doc, y) { const { L, R } = PDF; doc.setDrawColor(205, 214, 228); doc.line(L, y - 4, R, y - 4); return y + 8; }
/* Emphasised total row with a tinted background. */
function pdfTotal(doc, y, label, value, tint) {
  const { L, R } = PDF; const t = tint || [232, 240, 252];
  doc.setFillColor(t[0], t[1], t[2]); doc.rect(L, y - 12, R - L, 22, "F");
  doc.setDrawColor(180, 198, 226); doc.rect(L, y - 12, R - L, 22, "S");
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(12, 28, 56);
  doc.text(label, L + 8, y + 3); doc.text(String(value), R - 8, y + 3, { align: "right" });
  return y + 30;
}
function pdfNote(doc, y, text, color) {
  const c = color || [110, 122, 142];
  doc.setFont("helvetica", "italic"); doc.setFontSize(8.8); doc.setTextColor(c[0], c[1], c[2]);
  const lines = doc.splitTextToSize(text, PDF.W - 16);
  doc.text(lines, PDF.L + 8, y);
  return y + lines.length * 11 + 6;
}
/* Disclaimer + page number, drawn at the very bottom of the last page. */
function pdfFooter(doc, disclaimer) {
  const { L, R } = PDF;
  doc.setDrawColor(215, 222, 234); doc.line(L, 778, R, 778);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.6); doc.setTextColor(130, 142, 162);
  // Reserve the right-hand strip for the wordmark so the disclaimer can never run into it.
  const lines = doc.splitTextToSize(disclaimer, PDF.W - 78);
  doc.text(lines, L, 789);
  doc.setTextColor(79, 158, 255); doc.setFontSize(7.6);
  doc.text("findeshai.com", R, 789, { align: "right" });
}
/* Start a fresh page when content would run past the footer. */
function pdfBreak(doc, y, needed = 60) {
  if (y + needed < 770) return y;
  doc.addPage();
  doc.setFillColor(10, 22, 40); doc.rect(0, 0, 595, 40, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
  doc.text("FinDesh AI", PDF.L, 25);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(150, 170, 200);
  doc.text("findeshai.com", PDF.R, 25, { align: "right" });
  return 74;
}

/* Central analytics dispatch: GA4/GTM + Meta Pixel.
   Every event goes to Meta as a custom event of the same name (so Events Manager
   shows the same vocabulary as GA4). A few high-intent ones ALSO fire a standard
   Meta event, because standard events are what Ads campaign optimisation and
   Custom Audiences work best with. Change the map below if the ad objective changes. */
const FB_STANDARD = {
  tax_pdf_downloaded: "Lead",
  invest_pdf_downloaded: "Lead",
  borrow_pdf_downloaded: "Lead",
  tax_calc_completed: "ViewContent",
  tax_nbr_link_clicked: "Contact",
};
function taxTrack(event, params = {}) {
  try { if (window.dataLayer) window.dataLayer.push({ event, ...params }); if (typeof window.gtag === "function") window.gtag("event", event, params); } catch (e) { /* no-op */ }
  fbTrackCustom(event, params);
  if (FB_STANDARD[event]) fbTrack(FB_STANDARD[event], { content_name: event, ...params });
}
const incomeBucket = t => t < 400000 ? "<4L" : t < 700000 ? "4-7L" : t < 1100000 ? "7-11L" : t < 1600000 ? "11-16L" : t < 3100000 ? "16-31L" : "31L+";

function TaxLine({ label, value, sign = "", strong, color, note }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, padding: "7px 0", borderBottom: `1px solid ${T.borderSoft}` }}>
      <span style={{ fontSize: 13, color: strong ? "#fff" : T.muted, fontWeight: strong ? 700 : 500 }}>{label}{note && <span style={{ color: T.faint, fontWeight: 400 }}> · {note}</span>}</span>
      <span style={{ fontSize: strong ? 15 : 13.5, fontWeight: strong ? 800 : 600, color: color || (strong ? "#fff" : "#C9D8F0"), fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{sign}{fmtFull(value)}</span>
    </div>
  );
}

function IncomeTaxPage() {
  const nav = useNav();
  const calcRef = useRef(null), resultRef = useRef(null), startedRef = useRef(false);
  const [fy, setFy] = useState(DEFAULT_FY);
  const [category, setCategory] = useState("general");
  const [salary, setSalary] = useState("");
  const [other, setOther] = useState("");
  const [investment, setInvestment] = useState("");
  const [tds, setTds] = useState("");
  const [firstTime, setFirstTime] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [ai, setAi] = useState(""); const [aiLoading, setAiLoading] = useState(false);

  const P = digits(salary);
  const RULES = rulesFor(fy);
  const r = useMemo(() => calcIncomeTax({ gross: salary, other, investment, tds, category, firstTime, fy }), [salary, other, investment, tds, category, firstTime, fy]);
  const catLabel = (TAX_CATEGORIES.find(c => c.id === category) || {}).label || "General";

  // Allow one decimal point — payslips quote paisa.
  const clean = s => { const c = String(s).replace(/[^0-9.]/g, ""); const p = c.split("."); return p.length > 2 ? p[0] + "." + p.slice(1).join("") : c; };
  const onSalary = e => { setSalary(clean(e.target.value)); if (!startedRef.current) { startedRef.current = true; taxTrack("tax_calc_started"); } };
  const run = () => {
    if (!P || P < 1) { setErr("Please enter your annual salary to calculate."); return; }
    setErr(""); setSubmitted(true);
    taxTrack("tax_calc_completed", { taxable_income_bucket: incomeBucket(r.taxable), has_investment: digits(investment) > 0, rebate_state: r.rebateState });
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };
  const scrollToCalc = () => calcRef.current?.scrollIntoView({ behavior: "smooth" });
  const deep = (target, path) => { taxTrack("tax_deeplink_clicked", { target }); nav(path); };
  const nbrClick = () => taxTrack("tax_nbr_link_clicked");

  const downloadPDF = async () => {
    taxTrack("tax_pdf_download_started"); setPdfLoading(true); setErr("");
    try {
      const R = r.rules;
      const { doc, y: y0 } = await newPdfDoc(
        "Computation of Income Tax",
        R.label + "  (" + R.ay + ")   ·   Category: " + catLabel
      );
      let y = y0;

      /* --- 1. Income --- */
      y = pdfSection(doc, y, "1.  PARTICULARS OF INCOME");
      y = pdfRow(doc, y, "Income from salary (gross)", bdt2(r.gross));
      y = pdfRow(doc, y, "Income from other sources", bdt2(r.other));
      y = pdfRule(doc, y);
      y = pdfRow(doc, y, "Total Income", bdt2(r.grossTotal), { bold: true });
      y += 6;

      /* --- 2. Exemption --- */
      y = pdfSection(doc, y, "2.  EXEMPTION & TOTAL TAXABLE INCOME");
      y = pdfRow(doc, y, "Less: Exemption on salary income", "- " + bdt2(r.std), { note: "lower of 1/3rd or BDT 5,00,000" });
      y = pdfRule(doc, y);
      y = pdfTotal(doc, y, "Total Taxable Income", bdt2(r.taxable));

      /* --- 3. Slab-by-slab, the way a payroll sheet shows it --- */
      y = pdfBreak(doc, y, 190);
      y = pdfSection(doc, y, "3.  TAX COMPUTATION ON TAXABLE INCOME");
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(120, 134, 156);
      doc.text("SLAB", PDF.L + 8, y); doc.text("AMOUNT", 300, y, { align: "right" });
      doc.text("RATE", 372, y, { align: "right" }); doc.text("TAX", PDF.R - 8, y, { align: "right" });
      y += 6; y = pdfRule(doc, y);
      const applied = r.belowThreshold ? [] : r.slabDetail.filter(s => s.rate === 0 || s.applied > 0);
      applied.forEach((s, i) => {
        const amt = s.rate === 0 ? r.threshold : s.applied;
        doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(70, 84, 106);
        doc.text(i === 0 ? "On first" : "On next", PDF.L + 8, y);
        doc.text(Number(Math.round(amt)).toLocaleString("en-IN"), 300, y, { align: "right" });
        doc.text(s.rate === 0 ? "0%" : (s.rate * 100) + "%", 372, y, { align: "right" });
        doc.text(s.rate === 0 ? "Nil" : bdt2(s.tax), PDF.R - 8, y, { align: "right" });
        y += 15.5;
      });
      if (r.belowThreshold) y = pdfRow(doc, y, "Total income is within the tax-free limit of " + bdt(r.threshold), "Nil");
      y = pdfRule(doc, y);
      y = pdfTotal(doc, y, "Gross Tax Liability", bdt2(r.slabTax));

      /* --- 4. Rebate: show all three candidates and which one binds --- */
      if (!r.belowThreshold) {
        y = pdfBreak(doc, y, 150);
        y = pdfSection(doc, y, "4.  INVESTMENT REBATE CALCULATION");
        y = pdfRow(doc, y, "Actual eligible investment declared", bdt2(r.investment));
        y += 4;
        doc.setFont("helvetica", "normal"); doc.setFontSize(8.8); doc.setTextColor(120, 134, 156);
        doc.text("Rebate allowed is the LOWEST of the following three:", PDF.L + 8, y); y += 14;
        const lowest = Math.min(...r.rebateCandidates.map(c => c.value));
        r.rebateCandidates.forEach(c => {
          const binds = Math.abs(c.value - lowest) < 0.5;
          y = pdfRow(doc, y, (binds ? ">  " : "    ") + c.label, bdt2(c.value), {
            indent: 6, color: binds ? [20, 120, 90] : [140, 152, 172], bold: binds,
          });
        });
        y = pdfRule(doc, y);
        y = pdfRow(doc, y, "Rebate on Investment (allowed)", "- " + bdt2(r.rebate), { bold: true, color: [20, 120, 90] });
        y += 6;
      }

      /* --- 5. Net liability --- */
      y = pdfBreak(doc, y, 170);
      y = pdfSection(doc, y, (r.belowThreshold ? "4" : "5") + ".  NET TAX LIABILITY");
      y = pdfRow(doc, y, "Gross tax liability", bdt2(r.slabTax));
      if (!r.belowThreshold && r.rebate > 0) y = pdfRow(doc, y, "Less: Investment rebate", "- " + bdt2(r.rebate));
      if (!r.belowThreshold) y = pdfRow(doc, y, "Tax after rebate", bdt2(r.taxAfterRebate));
      if (r.minTaxApplied) y = pdfRow(doc, y, "Minimum tax applicable", bdt2(r.minTax), { note: "rebate cannot reduce tax below this floor", color: [176, 116, 20] });
      y = pdfRule(doc, y);
      y = pdfTotal(doc, y, "Net Tax Liability After Investment & Others", bdt2(r.net));
      y = pdfRow(doc, y, "Less: Tax deducted at source / advance tax paid", "- " + bdt2(r.tds));
      y = pdfRule(doc, y);
      y = r.refund > 0
        ? pdfTotal(doc, y, "Refundable / Adjustable", bdt2(r.refund), [225, 246, 238])
        : pdfTotal(doc, y, "Balance Tax Payable", bdt2(r.balance), [253, 238, 226]);

      /* --- 6. Planning note --- */
      if (!r.belowThreshold && r.rebateState === "A" && r.additionalTaxSaved > 0) {
        y = pdfBreak(doc, y, 70);
        y = pdfSection(doc, y, (r.belowThreshold ? "5" : "6") + ".  TAX PLANNING OBSERVATION");
        y = pdfNote(doc, y, "Investing a further " + bdt(r.investmentGap) + " in rebate-eligible instruments (Sanchayapatra, DPS, listed mutual funds or approved life insurance) before 30 June would raise the allowable rebate to its ceiling and reduce this liability by up to " + bdt(r.additionalTaxSaved) + ".", [20, 120, 90]);
      } else if (r.rebateUseless && !r.belowThreshold) {
        y = pdfBreak(doc, y, 70);
        y = pdfSection(doc, y, "6.  TAX PLANNING OBSERVATION");
        y = pdfNote(doc, y, "The minimum tax of " + bdt(r.minTax) + " applies to this taxpayer, and an investment rebate cannot reduce the liability below that floor for this year.");
      }

      /* --- Reference slab table --- */
      y = pdfBreak(doc, y, 150);
      y = pdfSection(doc, y, "REFERENCE:  " + R.label + " TAX SLABS (" + catLabel.toUpperCase() + ")");
      slabRows(r.threshold, r.fy).forEach(s => {
        const range = s.to === Infinity ? "Above " + bdt(s.from) : bdt(s.from) + "  -  " + bdt(s.to);
        y = pdfRow(doc, y, range, s.rate === 0 ? "Tax-free" : (s.rate * 100) + "%");
      });
      y += 4;
      y = pdfNote(doc, y, "Tax-free threshold " + bdt(r.threshold) + " · Investment rebate " + (R.rebate.rate * 100) + "% of investment, capped at " + (R.rebate.income_cap_rate * 100) + "% of taxable income and " + bdt(R.rebate.absolute_cap) + " · Minimum tax " + bdt(R.minimum_tax.regular) + " (Dhaka & Chattogram city corporations).");

      pdfFooter(doc, "Prepared by FinDesh AI (findeshai.com) for personal planning purposes only. This is a computer-generated estimate based on published " + R.label + " rates and the figures entered by the user. It is not a certified tax computation and is not a substitute for advice from a licensed tax practitioner. Returns must be filed through the official NBR e-Return portal at etaxnbr.gov.bd.");
      doc.save("FinDesh-Income-Tax-Computation-" + R.label.replace(/\s/g, "") + ".pdf");
      taxTrack("tax_pdf_downloaded", { fy: r.fy });
    } catch (e) { setErr("Couldn't generate the PDF just now — please try again."); }
    finally { setPdfLoading(false); }
  };

  const localInsight = () => {
    if (r.belowThreshold) return `Your taxable income (${fmt(r.taxable)}) is below the ৳${(r.threshold / 100000).toFixed(2).replace(/\.00$/, "")} Lakh tax-free limit for the ${catLabel.toLowerCase()} category, so you owe no income tax this year — nice. Keep your TIN active and file a zero return if any mandatory-filing rule applies to you.`;
    let s = `Your income tax for ${RULES.label} comes to ${fmt(r.net)}${r.balance > 0 ? `, with ${fmt(r.balance)} still to pay after TDS` : r.refund > 0 ? `, and ${fmt(r.refund)} is refundable/adjustable against your TDS` : ``}. `;
    if (r.rebateState === "A") s += `Boro sujog ache — invest about ${fmt(r.investmentGap)} more in Sanchayapatra, DPS or a listed fund before 30 June and you could cut up to ${fmt(r.additionalTaxSaved)} more off your bill. `;
    else if (r.rebateState === "C") s += `You've already invested more than needed for the rebate — extra is fine for your goals but won't cut more tax. `;
    else s += `You're getting essentially the full rebate you're eligible for — bhalো korechen. `;
    s += `Next step: file on the NBR e-Return portal before the deadline.`;
    return s;
  };
  const askAI = async () => {
    setAiLoading(true); setAi("");
    try {
      const key = import.meta.env.VITE_GEMINI_KEY; if (!key) throw new Error("no-key");
      const prompt = `You are a Bangladeshi personal finance expert. A user just calculated their ${RULES.label} Bangladesh income tax: gross income ৳${r.gross}, taxable income ৳${r.taxable}, slab tax ৳${Math.round(r.slabTax)}, investment rebate ৳${Math.round(r.rebate)}, net tax ৳${r.net}, balance to pay ৳${r.balance}. They invested ৳${r.investment} in eligible instruments this year — the optimum for their income was ৳${Math.round(r.optimumInvestment)}. In 3-4 short sentences, tell them in Bangla-English mix (natural code-switching): what they owe, whether they used their rebate well, and one concrete next step. No new numbers, no legal or filing advice. Plain language, no markdown headers.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      const data = await res.json(); const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("empty"); setAi(text.trim());
    } catch { setAi(localInsight()); } finally { setAiLoading(false); }
  };

  const eduChip = <button className="fd-chip" onClick={scrollToCalc} style={{ ...chip(false), marginTop: 12, padding: "8px 14px", fontSize: 12.5 }}>Try it with your numbers →</button>;
  const EDU = [
    { icon: "🪪", t: "Who needs to file", b: <>You must file a return if your income crosses the tax-free limit — or, regardless of income, if you fall in a mandatory-filing category: you hold a TIN and run a business, own a car, own a flat/land in a city corporation area, are a government employee, hold a credit card, are a member of a club, or are a professional (doctor, lawyer, engineer). When in doubt, having a TIN usually means you should file, even a zero return. (Full list: NBR.)</> },
    { icon: "🗓️", t: "FY 2025-26 vs FY 2026-27 — why your payslip may differ", b: <>These are two different rule sets, and mixing them is the #1 reason a calculator disagrees with your employer's tax sheet. <b style={{ color: "#fff" }}>FY 2025-26</b> (the return you file by 30 Nov 2026): tax-free ৳3,75,000, rebate <b style={{ color: T.green }}>15%</b> of investment, ceiling ৳10 Lakh. <b style={{ color: "#fff" }}>FY 2026-27</b>: tax-free ৳4,00,000, rebate cut to <b style={{ color: T.amber }}>10%</b>, ceiling ৳7.5 Lakh. Same salary, different tax. Use the year selector above.</> },
    { icon: "📐", t: "Tax slabs — a worked example", b: <>Say you earn <b style={{ color: "#fff" }}>৳8 Lakh</b>/year (general) in {RULES.label}. Standard deduction = ⅓ = {fmt(266667)}, so taxable income ≈ {fmt(533333)}. The first {fmt(RULES.thresholds.general)} is tax-free; the remaining {fmt(Math.max(533333 - RULES.thresholds.general, 0))} is taxed at 10% = about {fmt(Math.max(533333 - RULES.thresholds.general, 0) * 0.1)}. After the ৳5,000 minimum-tax check, that's your slab tax before any rebate. Every taka you invest in eligible instruments then chips away at it.</> },
    { icon: "🎁", t: "The investment rebate — most under-used tool", b: <>In {RULES.label} you get back <b style={{ color: T.green }}>{RULES.rebate.rate * 100}%</b> of what you invest in eligible instruments (Sanchayapatra, DPS, listed mutual funds, life insurance) — but capped at <b>3% of your taxable income</b> and <b>{fmt(RULES.rebate.absolute_cap)}</b>. Rule of thumb: investing about <b style={{ color: "#fff" }}>{Math.round(3 / (RULES.rebate.rate * 100) * 100)}% of your taxable income</b> hits the maximum rebate. Beyond that, extra investment is great for your goals but earns no more tax back.</> },
    { icon: "🔒", t: "Minimum tax", b: <>If your income crosses the threshold, there's a floor: <b style={{ color: "#fff" }}>৳5,000</b> minimum tax (৳1,000 for a first-time filer under ৳4.5 Lakh). This is why a big rebate can take your slab tax to zero but you may still owe the ৳5,000 floor. That ৳5,000 applies in Dhaka and Chattogram city corporations — elsewhere it's ৳4,000 or ৳3,000. Below the threshold, though, there's no tax and no minimum.</> },
    { icon: "📅", t: "Filing incentives & penalties", table: [["Jul 1 – Sep 30", "5% rebate on tax (max ৳25,000)", T.green], ["Oct 1 – Dec 31", "No rebate, no penalty", T.muted], ["Jan 1 – Mar 31", "+2% additional tax (min ৳3,000)", T.amber], ["Apr 1 – Jun 30", "+5% additional tax (min ৳5,000)", T.red]] },
    { icon: "📄", t: "Documents you'll need", b: <>Keep these ready before you file: your <b style={{ color: "#fff" }}>TIN certificate</b>, salary certificate, bank statements, investment proofs (DPS/Sanchayapatra/insurance receipts), TDS certificates from your employer, and property or vehicle papers if they apply. Having them organised turns filing into a 20-minute job.</> },
  ];

  const FAQ_ITEMS = [
    { q: "Which financial year should I calculate — FY 2025-26 or FY 2026-27?", a: "If you're filing a return in 2026, you need FY 2025-26 (income earned 1 July 2025 to 30 June 2026, assessment year 2026-27) — that's the return due by 30 November 2026. Use FY 2026-27 only to plan the year you're currently earning in. This calculator does both; pick the year at the top." },
    { q: "What is the tax-free income limit in Bangladesh?", a: "For FY 2025-26 the general tax-free limit is ৳3,75,000 — ৳4,25,000 for women and senior citizens (65+), ৳5,00,000 for persons with disability and third-gender taxpayers, and ৳5,25,000 for gazetted war-wounded freedom fighters. For FY 2026-27 the general limit rises to ৳4,00,000. Income above your limit is taxed on a slab basis." },
    { q: "How is the income tax rebate calculated?", a: "Your rebate is the lowest of three numbers: a percentage of your eligible investment, 3% of your taxable income, and a statutory ceiling. For FY 2025-26 it's 15% of investment with a ৳10,00,000 ceiling; for FY 2026-27 the rate was cut to 10% with a ৳7,50,000 ceiling. It's subtracted straight from your calculated tax." },
    { q: "Why doesn't my employer's tax sheet match this calculator?", a: "Almost always one of three things. First, fiscal year — a June 2026 payslip uses FY 2025-26 rules, not FY 2026-27. Second, the rebate rate changed from 15% to 10% between those years. Third, income base — corporate payroll often includes the employer's provident-fund contribution in total income before the one-third exemption, so enter your total income, not just take-home pay." },
    { q: "What investments qualify for the tax rebate?", a: "Sanchayapatra (national savings certificates), DPS (deposit pension schemes), listed mutual funds and shares, approved life-insurance premiums, and provident-fund contributions. Sanchayapatra and a bank DPS are the two most popular and lowest-risk options." },
    { q: "What is the minimum income tax in Bangladesh?", a: "If your income crosses the tax-free threshold, the minimum tax is ৳5,000 in Dhaka North, Dhaka South and Chattogram city corporations — ৳4,000 in other city corporations and ৳3,000 elsewhere — or ৳1,000 for a first-time filer whose taxable income is under ৳4,50,000. A rebate can't reduce your tax below this floor." },
    { q: "What is the deadline to file my tax return?", a: "For individual taxpayers, 'Tax Day' is 30 November. Filing between 1 July and 30 September earns a 5% rebate on your tax (up to ৳25,000); filing after the deadline adds a 2%–5% surcharge with a minimum penalty. Earlier is cheaper." },
    { q: "How much investment do I need to make to get the maximum rebate?", a: "It depends on the year. In FY 2025-26 you earn 15% back and the rebate caps at 3% of taxable income, so roughly 20% of taxable income maximises it. In FY 2026-27 the rate dropped to 10%, so you need about 30%. Our calculator shows your exact optimum figure for the year you select." },
    { q: "Do women and senior citizens pay less tax?", a: "Effectively yes — they get a higher tax-free threshold (৳4,25,000 vs ৳3,75,000 general in FY 2025-26), so the first slab of tax starts later. Persons with disability, third-gender taxpayers and freedom fighters get even higher thresholds." },
    { q: "Is Sanchayapatra interest still taxable?", a: "Source tax (5–10%) is deducted on Sanchayapatra profit at payout, and the interest is part of your total income. But the investment itself still qualifies for the rebate, and it remains the highest safe return in Bangladesh — see our Sanchayapatra page for current rates." },
    { q: "Where do I actually file my return?", a: "Filing happens on the government's own e-Return system, run by the National Board of Revenue (NBR). FinDesh doesn't file for you — we help you understand and plan. When you're ready to file, head to the official NBR e-Return portal." },
  ];

  return (
    <>
      <div style={{ textAlign: "center", padding: "44px 0 20px" }}>
        <div className="fd-up" style={pill}>🧾 Income Tax · আয়কর</div>
        <h1 className="fd-up fd-up-1" style={{ ...h1, fontSize: "clamp(28px,6vw,44px)" }}>Bangladesh income tax, made <span style={gradText}>simple</span></h1>
        <p className="fd-up fd-up-2" style={sub}>Free calculator for <b style={{ color: "#fff" }}>both</b> FY 2025-26 (the return you file this year) and FY 2026-27 — plus a rebate optimiser that shows exactly how much Sanchayapatra or DPS could cut your tax.</p>
      </div>
      <UpdatedBadge />

      <div style={{ ...inflationNote, marginTop: 0, marginBottom: 18 }}>⚠️ Rules differ between the two years — most importantly the investment rebate was cut from 15% to 10%. Pick the year you're actually filing for. Results are for planning only, not a substitute for a certified tax adviser.</div>

      {/* ---------- Calculator ---------- */}
      <div ref={calcRef} className="fd-up fd-up-3" style={card}>
        <label style={lbl}>Which financial year?</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {FY_LIST.map(y => {
            const on = fy === y, R = FY_RULES[y];
            return (
              <button key={y} className="fd-chip" onClick={() => { setFy(y); taxTrack("tax_fy_changed", { fy: y }); }}
                style={{ ...chip(on), flex: 1, padding: "12px 8px", textAlign: "center", lineHeight: 1.35, touchAction: "manipulation" }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 800 }}>{R.label}</span>
                <span style={{ display: "block", fontSize: 10.5, opacity: .8, fontWeight: 600 }}>{y === DEFAULT_FY ? "File now ✓" : R.filedIn.replace("Filed ", "")}</span>
              </button>
            );
          })}
        </div>
        <p style={{ margin: "0 0 22px", fontSize: 11.5, color: T.faint }}>
          {fy === "2025-26"
            ? "Income earned 1 Jul 2025 – 30 Jun 2026. This is the return due by 30 November 2026. Tax-free limit ৳3,75,000 · rebate 15%."
            : "Income earned 1 Jul 2026 – 30 Jun 2027 — use this to plan ahead. Tax-free limit ৳4,00,000 · rebate 10%."}
        </p>

        <label style={lbl}>Taxpayer category</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
          {TAX_CATEGORIES.map(c => (
            <button key={c.id} className="fd-chip" onClick={() => setCategory(c.id)} style={{ ...chip(category === c.id), flex: "1 1 30%", padding: "10px 6px", fontSize: 12, touchAction: "manipulation" }}>{c.label}</button>
          ))}
        </div>

        <label style={lbl}>Annual gross salary</label>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <span style={taka}>৳</span>
          <input className="fd-input" value={salary} onChange={onSalary} onKeyDown={e => e.key === "Enter" && run()} inputMode="decimal" placeholder="8,00,000" style={bigInput} aria-label="Annual gross salary" />
          {P > 0 && <span style={inputHint}>{fmt(P)}</span>}
        </div>
        <p style={{ margin: "0 0 20px", fontSize: 11.5, color: T.faint }}>Include cash salary + house rent, medical & conveyance allowances.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 6 }}>
          <div>
            <label style={lbl}>Other income</label>
            <div style={{ position: "relative" }}><span style={{ ...taka, fontSize: 18 }}>৳</span>
              <input className="fd-input" value={other} onChange={e => setOther(clean(e.target.value))} inputMode="decimal" placeholder="0" style={{ ...bigInput, fontSize: 18, padding: "13px 14px 13px 38px" }} aria-label="Other annual income" /></div>
          </div>
          <div>
            <label style={lbl}>Investment this year</label>
            <div style={{ position: "relative" }}><span style={{ ...taka, fontSize: 18 }}>৳</span>
              <input className="fd-input" value={investment} onChange={e => setInvestment(clean(e.target.value))} inputMode="decimal" placeholder="0" style={{ ...bigInput, fontSize: 18, padding: "13px 14px 13px 38px" }} aria-label="Eligible investment made this year" /></div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, color: T.faint }}>Rent, business, freelance — advanced income types coming soon; leave 0 if none.</p>
          <p style={{ margin: "0 0 12px", fontSize: 11, color: T.faint }}>DPS + Sanchayapatra + mutual funds + life-insurance premium.</p>
        </div>

        <label style={lbl}>Tax already deducted (TDS)</label>
        <div style={{ position: "relative", marginBottom: 6 }}><span style={{ ...taka, fontSize: 18 }}>৳</span>
          <input className="fd-input" value={tds} onChange={e => setTds(clean(e.target.value))} inputMode="decimal" placeholder="0" style={{ ...bigInput, fontSize: 18, padding: "13px 14px 13px 38px" }} aria-label="Tax deducted at source" /></div>
        <p style={{ margin: "0 0 18px", fontSize: 11.5, color: T.faint }}>Tax deducted at source by your employer — check your payslip.</p>

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 22 }}>
          <input type="checkbox" checked={firstTime} onChange={e => setFirstTime(e.target.checked)} style={{ width: 17, height: 17, accentColor: T.accent }} />
          <span style={{ fontSize: 13.5, color: T.muted, fontWeight: 500 }}>This is my first time filing a return 🆕</span>
        </label>

        {err && <p style={errStyle}>{err}</p>}
        <button className="fd-cta" onClick={run} style={{ ...cta, touchAction: "manipulation" }}>{submitted ? "Update my tax →" : "Calculate my tax →"}</button>
      </div>

      {/* ---------- Result ---------- */}
      {submitted && (
        <div ref={resultRef} style={{ marginTop: 28 }}>
          <div className="fd-up" style={{ ...card, textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: T.accent, fontWeight: 800, letterSpacing: ".08em", marginBottom: 8 }}>YOUR INCOME TAX · {RULES.label}</div>
            {r.belowThreshold ? (
              <>
                <div style={{ fontSize: 34, fontWeight: 900, color: T.green, letterSpacing: "-0.02em", marginBottom: 8 }}>৳0 — you're below the tax-free limit</div>
                <p style={{ margin: "0 auto", maxWidth: 440, fontSize: 13.5, color: T.muted, lineHeight: 1.6 }}>Your taxable income of {fmt(r.taxable)} is under the {fmt(r.threshold)} tax-free threshold for the {catLabel.toLowerCase()} category, so no income tax and no minimum tax apply. If a mandatory-filing rule applies to you, file a zero return to stay compliant.</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: "clamp(30px,8vw,44px)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1 }}><span style={gradText}>{fmtFull(r.net)}</span></div>
                <div style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>{r.balance > 0 ? <>Balance to pay after TDS: <b style={{ color: "#fff" }}>{fmtFull(r.balance)}</b></> : r.refund > 0 ? <>Refundable / adjustable: <b style={{ color: T.green }}>{fmtFull(r.refund)}</b></> : "Fully covered by your TDS 🎉"}</div>
              </>
            )}
          </div>

          {!r.belowThreshold && (
            <div className="fd-up" style={{ ...card, padding: "18px 20px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.faint, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>The receipt</div>
              <TaxLine label="Gross income" value={r.gross} />
              <TaxLine label="Standard deduction (⅓, cap ৳5L)" value={r.std} sign="− " color={T.green} />
              <TaxLine label="Taxable income" value={r.taxable} strong />
              <TaxLine label="Slab tax" value={r.slabTax} />
              {r.rebate > 0 && <TaxLine label="Investment rebate" value={r.rebate} sign="− " color={T.green} />}
              {r.minTaxApplied && <TaxLine label="Minimum tax floor" value={r.minTax} note="rebate can't go below this" color={T.amber} />}
              <TaxLine label="Net tax payable" value={r.net} strong />
              {r.tds > 0 && <TaxLine label="Less: TDS already paid" value={r.tds} sign="− " color={T.green} />}
              <TaxLine label={r.refund > 0 ? "Refund / adjustable" : "Balance to pay"} value={r.refund > 0 ? r.refund : r.balance} strong color={r.refund > 0 ? T.green : "#fff"} />
            </div>
          )}

          {/* ---- Rebate optimiser ---- */}
          {!r.belowThreshold && (
            <div className="fd-up" style={{ ...card, marginBottom: 16, borderColor: r.rebateState === "A" ? "rgba(0,214,143,0.4)" : r.rebateState === "C" ? "rgba(255,180,84,0.4)" : T.border, background: r.rebateState === "A" ? "linear-gradient(135deg, rgba(0,214,143,0.10), rgba(8,18,36,0.9))" : T.glass }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: r.rebateState === "A" ? T.green : T.accent, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>💡 Rebate optimiser</div>
              {r.rebateUseless ? (
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#EAF1FC" }}>Your income is above the tax-free limit, so the <b style={{ color: "#fff" }}>{fmtFull(r.minTax)} minimum tax</b> for filers applies — a rebate can't reduce it further this year. Investing is still worthwhile for your goals; it just won't cut this bill.</p>
              ) : r.rebateState === "A" ? (
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#EAF1FC" }}>You could save up to <b style={{ color: T.green }}>{fmtFull(r.additionalTaxSaved)}</b> more in tax this year. Invest about <b style={{ color: "#fff" }}>{fmtFull(r.investmentGap)}</b> more in eligible instruments (Sanchayapatra, DPS, listed mutual funds, life insurance) before 30 June to reach your maximum rebate of {fmt(Math.min(0.03 * r.taxable, 750000))}.</p>
              ) : r.rebateState === "C" ? (
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#EAF1FC" }}>You've invested more than you need to for the rebate (your optimum was about <b style={{ color: "#fff" }}>{fmtFull(r.optimumInvestment)}</b>). Extra investment is still great for your goals — it just doesn't cut any more tax.</p>
              ) : (
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#EAF1FC" }}>You're getting essentially the maximum rebate you're eligible for. Nicely optimised. 👏</p>
              )}
            </div>
          )}

          {/* ---- Deep-links ---- */}
          {!r.belowThreshold && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginBottom: 16 }}>
              {[
                { k: "sanchayapatra", icon: "🏛️", t: "Sanchayapatra", d: "Government-guaranteed, 11.83% (Jan 2026 revised rate).", cta: "See the Sanchayapatra page →", path: "/sanchayapatra" },
                { k: "dps", icon: "💰", t: "DPS Planner", d: r.rebateState === "A" && r.investmentGap > 0 ? `Automate about ${fmt(r.investmentGap / 12)}/month in a DPS.` : "Automate a monthly DPS to build the rebate habit.", cta: "See the Save tool →", path: "/save" },
                { k: "invest", icon: "📈", t: "Listed mutual funds", d: "Rebate-eligible up to ৳75 Lakh under Finance Act 2026.", cta: "See the Invest tool →", path: "/invest" },
              ].map((d, i) => (
                <div key={d.k} className={`fd-item fd-up fd-up-${Math.min(i, 3)}`} onClick={() => deep(d.k, d.path)} style={{ background: T.glass, border: `1px solid ${T.border}`, borderRadius: 16, padding: "16px 17px", cursor: "pointer", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: T.green, opacity: 0.85 }} />
                  <div style={{ fontSize: 20, marginBottom: 6, pointerEvents: "none" }}>{d.icon}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: "#fff", marginBottom: 4, pointerEvents: "none" }}>{d.t}</div>
                  <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5, marginBottom: 8, pointerEvents: "none" }}>{d.d}</div>
                  <div style={{ fontSize: 12.5, color: T.accent, fontWeight: 700, pointerEvents: "none" }}>{d.cta}</div>
                </div>
              ))}
            </div>
          )}

          {/* ---- Actions ---- */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
            <button className="fd-cta" onClick={downloadPDF} disabled={pdfLoading} style={{ ...cta, flex: "1 1 240px", opacity: pdfLoading ? 0.7 : 1, touchAction: "manipulation" }}>{pdfLoading ? <>Preparing <span className="fd-spin" /></> : "📄 Download full computation sheet (PDF)"}</button>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 11.5, color: T.faint }}>A detailed, slab-by-slab statement you can check against your employer's tax sheet or hand to your accountant.</p>
          {err && submitted && <p style={errStyle}>{err}</p>}

          {/* ---- Optional AI explainer ---- */}
          {!r.belowThreshold && (
            <div style={{ marginTop: 6 }}>
              <button className="fd-cta" onClick={askAI} disabled={aiLoading} style={{ ...cta, background: "linear-gradient(135deg,#7C3AED,#4F9EFF)", opacity: aiLoading ? 0.7 : 1, touchAction: "manipulation" }}>{aiLoading ? <>Thinking <span className="fd-spin" /></> : "🤖 Explain my result in plain Bangla-English"}</button>
              {ai && (
                <div className="fd-up" style={{ marginTop: 12, background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.35)", borderRadius: 14, padding: "14px 16px" }}>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "#D8CCF5", whiteSpace: "pre-wrap" }}>{ai}</p>
                  <div style={{ fontSize: 10.5, color: T.faint, marginTop: 8 }}>Explained by AI · check with a pro before filing.</div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ---------- Education ---------- */}
      <SectionHead title="How BD income tax works" hint="Six things worth knowing" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {EDU.map((e, i) => (
          <div key={i} className="fd-item" style={{ background: T.glass, border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: T.accent, opacity: 0.85 }} />
            <div style={{ fontSize: 15.5, fontWeight: 800, color: "#fff", marginBottom: 8 }}><span style={{ marginRight: 8 }}>{e.icon}</span>{e.t}</div>
            {e.b && <div style={{ fontSize: 13.5, color: "#B8C7E0", lineHeight: 1.7 }}>{e.b}</div>}
            {e.table && (
              <div style={{ overflowX: "auto", marginTop: 4 }}>
                <table className="fd-tbl"><tbody>{e.table.map((row, ri) => (<tr key={ri}><td style={{ fontWeight: 600, color: "#EAF1FC" }}>{row[0]}</td><td style={{ color: row[2], textAlign: "left" }}>{row[1]}</td></tr>))}</tbody></table>
              </div>
            )}
            {eduChip}
          </div>
        ))}
      </div>

      {/* ---------- FAQ ---------- */}
      <FAQ items={FAQ_ITEMS} />

      {/* ---------- Where to file (NBR only) ---------- */}
      <div className="fd-up" style={{ ...card, marginTop: 16, textAlign: "center", padding: "22px 20px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "#fff" }}>Ready to file?</h3>
        <p style={{ margin: "0 auto 14px", maxWidth: 460, fontSize: 13.5, color: T.muted, lineHeight: 1.6 }}>Filing happens on the government's own e-Return system, run by the National Board of Revenue. FinDesh doesn't file for you — we're here to help you understand and plan.</p>
        <a href={NBR_ERETURN_URL} target="_blank" rel="noreferrer" onClick={nbrClick} className="fd-cta" style={{ ...cta, display: "inline-block", width: "auto", padding: "13px 24px", textDecoration: "none" }}>Go to the NBR e-Return portal →</a>
      </div>

      {/* ---------- CTA ---------- */}
      <div className="fd-up" style={{ marginTop: 24, background: "linear-gradient(135deg, rgba(79,158,255,0.16), rgba(8,18,36,0.9))", border: `1px solid ${T.accentBorder}`, borderRadius: 20, padding: "24px 22px", textAlign: "center" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 900, color: "#fff" }}>Want a full money plan around this?</h3>
        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: T.muted, lineHeight: 1.65 }}>Tax is one piece. The Blueprint ties your saving, investing and rebate strategy together.</p>
        <button className="fd-cta" onClick={() => deep("blueprint", "/blueprint")} style={{ ...cta, width: "auto", padding: "14px 26px", touchAction: "manipulation" }}>Open the Money Blueprint →</button>
      </div>

      <RelatedLinks links={[
        { label: "Sanchayapatra", path: "/sanchayapatra" },
        { label: "Where to invest", path: "/invest" },
        { label: "Savings & DPS planner", path: "/save" },
        { label: "Money Blueprint", path: "/blueprint" },
      ]} />
      <TabDisclaimer />
    </>
  );
}

/* ============================================================
   COMPARISON HUB — Credit Cards · Savings · Loans.
   Data sourced June 2026 from each bank's own official rate sheets
   (Declared Lending Rate PDFs, deposit sheets, card schedule-of-charges).
   "Contact bank" = figure genuinely not published online. Pattern:
   Paisabazaar-style card grid + multi-select compare; NerdWallet table.
   ============================================================ */
const CMP_UPDATED = "June 2026";

/* Loans — reducing-balance bands from official Declared Lending Rate sheets */
const CMP_LOANS = [
  { bank: "Eastern Bank (EBL)", personal: "10.0% (9–11)", pmid: 10.0, home: "10.0% (9–11)", hmid: 10.0, car: "11.0% (10–12)", cmid: 11.0, src: "EBL · Jun 2026" },
  { bank: "Mutual Trust Bank (MTB)", personal: "13.0–14.5%", pmid: 13.75, home: "10.5–11.5%", hmid: 11.0, car: "10.5–11.5%", cmid: 11.0, src: "MTB · May 2026", note: "Personal ৳50K–৳40L, 6–60 mo; optional loan-shield insurance." },
  { bank: "Prime Bank", personal: "11.0–13.0%", pmid: 12.0, home: "10.5–12.5%", hmid: 11.5, car: "11.0–13.0%", cmid: 12.0, src: "Prime · Oct 2024" },
  { bank: "Dutch-Bangla (DBBL)", personal: "11.0–13.0%", pmid: 13.0, home: "11.5%", hmid: 11.5, car: "13.0%", cmid: 13.0, src: "DBBL · Jan 2025", note: "⚠ Rate sheet ~17 months old — confirm current rate." },
  { bank: "City Bank", personal: "16–18% (unsecured)", pmid: 17.0, home: "11.0% (10–12)", hmid: 11.0, car: "12.0% (11–13)", cmid: 12.0, src: "City · Dec 2025", note: "⚠ Unsecured personal is high; a secured salary loan is ~9%. Verify your rate." },
  { bank: "UCB", personal: "14.0% (13–15)", pmid: 14.0, home: "11.25% (11–11.5)", hmid: 11.25, car: "12.5% (12–13)", cmid: 12.5, src: "UCB · Jun 2026" },
  { bank: "Bank Asia", personal: "14.5%", pmid: 14.5, home: "13.5%", hmid: 13.5, car: "13.5% (auto)", cmid: 13.5, src: "Bank Asia · 2026" },
  { bank: "Premier Bank", personal: "14.0% (13–15)", pmid: 14.0, home: "14.0% (13–15)", hmid: 14.0, car: "14.0% (13–15)", cmid: 14.0, src: "Premier · Jun 2026", note: "⚠ Higher-end pricing across products. Verify current rate." },
  { bank: "SouthEast Bank", personal: "~13–14% (indicative)", pmid: 13.5, home: "~13% (indicative)", hmid: 13.0, car: "৳60L / 60% of value, 1–5 yr", cmid: 13.0, src: "SEBL", note: "Personal/home indicative (image-only sheet) — confirm with bank." },
  { bank: "BRAC Bank", personal: "Variable (base + margin)", pmid: 12.0, home: "Variable (base + margin)", hmid: 12.0, car: "Variable (base + margin)", cmid: 12.0, src: "BRAC · Feb 2026", note: "Base = avg 6-month FDR rate of private banks + margin; indicative ~10.5–12.75%." },
];

/* Savings — regular savings account rate (tiered) from official deposit sheets */
const CMP_SAVINGS = [
  { bank: "Premier Bank", rate: "3.00–4.00%", rmid: 4.0, islamic: true, note: "⚠ Tiered; unusually high vs peers — verify it's current. (May 2025 sheet)", src: "Premier" },
  { bank: "Bank Asia", rate: "2.00–3.00%", rmid: 3.0, islamic: true, note: "Tiered; 3% above ৳1 Cr.", src: "Bank Asia · 2026" },
  { bank: "BRAC Bank", rate: "0.50–2.50%", rmid: 2.5, islamic: false, note: "Tiered; AAA-rated bank.", src: "BRAC · Jan 2026" },
  { bank: "Prime Bank", rate: "0–2.50%", rmid: 2.5, islamic: true, note: "0% up to ৳10K, 2.50% above.", src: "Prime · Mar 2025" },
  { bank: "UCB", rate: "1.00–2.25%", rmid: 2.25, islamic: true, note: "From 1% on low balances, up to 2.25%.", src: "UCB · Apr 2026" },
  { bank: "Eastern Bank (EBL)", rate: "0–2.00%", rmid: 2.0, islamic: false, note: "0% under ৳50K, up to 2% above ৳25L.", src: "EBL · May 2026" },
  { bank: "City Bank", rate: "0–0.25%", rmid: 0.25, islamic: true, note: "General Savings; lowest in the set.", src: "City · 2026" },
  { bank: "Dutch-Bangla (DBBL)", rate: "Contact bank", rmid: -1, islamic: false, note: "Regular-savings rate not published online.", src: "—" },
  { bank: "Mutual Trust Bank (MTB)", rate: "Contact bank", rmid: -1, islamic: false, note: "Regular-savings rate not published online.", src: "—" },
  { bank: "SouthEast Bank", rate: "Contact bank", rmid: -1, islamic: true, note: "Regular-savings rate not published online.", src: "—" },
];

/* Credit cards — flagship cards. Fee/APR from official sheets where posted;
   reward structures are not publicly disclosed → "contact bank". */
const CMP_CARDS = [
  { id: "seb-world", bank: "SouthEast Bank", name: "World Card", network: "Visa / Mastercard", fee: "৳6,500/yr", apr: "25%", benefit: "Airport lounge access; premium tier", tags: ["travel"] },
  { id: "seb-classic", bank: "SouthEast Bank", name: "Classic", network: "Visa / Mastercard", fee: "৳1,200/yr", apr: "25%", benefit: "Lowest annual fee; entry-level", tags: ["lowfee"] },
  { id: "seb-tijarah", bank: "SouthEast Bank", name: "Tijarah (Islamic)", network: "Visa / Mastercard", fee: "৳6,000/yr", apr: "Profit-based", benefit: "Shariah-compliant credit card", tags: ["islamic"] },
  { id: "dbbl", bank: "Dutch-Bangla (DBBL)", name: "Credit Card", network: "Visa / Mastercard / Nexus", fee: "Contact bank", apr: "18%", benefit: "Lowest card APR in this set (18%)", tags: ["lowapr"] },
  { id: "city-amex", bank: "City Bank", name: "American Express", network: "American Express", fee: "Contact bank", apr: "24%", benefit: "Sole Amex issuer in BD; Membership Rewards", tags: ["rewards"] },
  { id: "ebl", bank: "Eastern Bank (EBL)", name: "Credit Card", network: "Visa / Mastercard", fee: "Contact bank", apr: "25%", benefit: "Skybanking app; EBL rewards", tags: ["rewards"] },
  { id: "ucb", bank: "UCB", name: "Credit Card", network: "Visa / Mastercard", fee: "Contact bank", apr: "25%", benefit: "Wide acceptance; UCB privileges", tags: [] },
  { id: "premier", bank: "Premier Bank", name: "Credit Card", network: "Visa / Mastercard", fee: "Contact bank", apr: "25%", benefit: "Premier card privileges", tags: [] },
];
const CARD_FILTERS = [["all", "All"], ["lowapr", "Lowest APR"], ["travel", "Travel / Lounge"], ["lowfee", "Low fee"], ["rewards", "Rewards"], ["islamic", "Islamic"]];

/* ---------- shared: comparison FAQ (expandable, SEO-friendly) ---------- */
function FAQ({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div style={{ marginTop: 30 }}>
      <SectionHead title="Frequently asked" hint="Tap to expand" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((it, i) => (
          <div key={i} className="fd-item" onClick={() => setOpen(open === i ? -1 : i)} style={{ background: T.glass, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer", backdropFilter: "blur(12px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, pointerEvents: "none" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{it.q}</span>
              <span style={{ color: T.accent, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>{open === i ? "−" : "+"}</span>
            </div>
            {open === i && <p className="fd-up" style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.65, color: "#B8C7E0", pointerEvents: "none" }}>{it.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareDisclaimer() {
  return (
    <p style={{ fontSize: 11.5, color: T.faint, lineHeight: 1.65, margin: "26px 6px 0", textAlign: "center" }}>
      Rates &amp; fees compiled {CMP_UPDATED} from each bank's official rate sheets and change often — always confirm directly with the bank before applying. "Contact bank" means the figure is not published publicly online. Educational information only, not financial advice.
    </p>
  );
}

/* ---------- LOAN COMPARISON ---------- */
function LoanComparePage() {
  const nav = useNav();
  const [type, setType] = useState("personal");
  const midKey = { personal: "pmid", home: "hmid", car: "cmid" }[type];
  const rows = [...CMP_LOANS].sort((a, b) => a[midKey] - b[midKey]);
  const types = [["personal", "Personal"], ["home", "Home"], ["car", "Car"]];
  return (
    <>
      <div style={{ textAlign: "center", padding: "40px 0 16px" }}>
        <div className="fd-up" style={pill}>🤝 Compare Loans · ঋণ তুলনা</div>
        <h1 className="fd-up fd-up-1" style={{ ...h1, fontSize: "clamp(26px,5.5vw,40px)" }}>Compare loans in <span style={gradText}>Bangladesh</span></h1>
        <p className="fd-up fd-up-2" style={sub}>Personal, home and car loan rates from 10 strong banks — side by side, with the real EMI before you ever walk into a branch.</p>
      </div>
      <UpdatedBadge />

      <EMICalculator />

      <div style={{ marginTop: 30 }}>
        <SectionHead title="Compare rates by loan type" hint="Lowest rate first · reducing balance" />
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {types.map(([k, label]) => (
            <button key={k} className="fd-chip" onClick={() => setType(k)} style={{ ...chip(type === k), flex: 1, minWidth: 90, padding: "11px 6px", fontSize: 13 }}>{label}</button>
          ))}
        </div>
        <div style={{ overflowX: "auto", background: "rgba(8,18,36,0.5)", border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: "6px 12px" }}>
          <table className="fd-tbl">
            <thead><tr><th>Bank</th><th>Rate (p.a.)</th><th>Source</th></tr></thead>
            <tbody>
              {rows.map((l, i) => (
                <tr key={l.bank}>
                  <td style={{ fontWeight: 600, color: "#EAF1FC" }}>{l.bank}{i === 0 && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: T.green }}>★ lowest</span>}</td>
                  <td style={{ color: "#fff", fontWeight: 700 }}>{l[type]}{l.note && <div style={{ fontSize: 10.5, color: T.faint, fontWeight: 500, marginTop: 2 }}>{l.note}</div>}</td>
                  <td style={{ color: T.faint, fontSize: 11.5 }}>{l.src}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={inflationNote}>💡 Rates are bands — your actual offer depends on income, employer and credit profile, and most are reducing-balance. A 1% lower rate on a 20-year home loan saves several lakh taka, so always negotiate and get a formal rate letter.</div>
      </div>

      <FAQ items={[
        { q: "Flat rate vs reducing-balance — what's the difference?", a: "On a reducing-balance loan, interest is charged only on the outstanding balance, which falls every month — so the true cost is much lower than the same headline number quoted 'flat'. Bangladeshi banks quote these consumer loans on a reducing-balance basis. Always ask which method applies." },
        { q: "Why is one bank's personal-loan rate so much higher?", a: "Unsecured personal loans are priced for risk and vary widely (here, roughly 10% to 18%). A loan secured against your salary, FDR or DPS is usually far cheaper. The rate you're offered also depends on your income, employer and credit history." },
        { q: "How is my monthly EMI calculated?", a: "EMI = P × r × (1+r)ⁿ ÷ ((1+r)ⁿ − 1), where P is the loan amount, r the monthly rate and n the number of months. Use the calculator above to see your EMI, total interest and a year-by-year breakdown." },
        { q: "Are these rates final?", a: "No — they're the banks' published bands as of " + CMP_UPDATED + ". Banks reprice periodically and your personal offer may differ. Confirm directly before applying." },
      ]} />

      <div className="fd-up" style={{ marginTop: 26, background: "linear-gradient(135deg, rgba(79,158,255,0.16), rgba(8,18,36,0.9))", border: `1px solid ${T.accentBorder}`, borderRadius: 20, padding: "24px 22px", textAlign: "center" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 900, color: "#fff" }}>Run your exact loan first</h3>
        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: T.muted, lineHeight: 1.65 }}>See the full EMI, total interest and whether it's worth it in the Borrow tool.</p>
        <button className="fd-cta" onClick={() => nav("/borrow")} style={{ ...cta, width: "auto", padding: "14px 26px" }}>Open the Borrow planner →</button>
      </div>
      <RelatedLinks links={[
        { label: "Borrow · EMI planner", path: "/borrow" },
        { label: "Compare savings accounts", path: "/compare/savings" },
        { label: "Compare credit cards", path: "/compare/credit-cards" },
        { label: "Where to invest", path: "/invest" },
      ]} />
      <CompareDisclaimer />
    </>
  );
}

/* ---------- SAVINGS COMPARISON ---------- */
function SavingsComparePage() {
  const nav = useNav();
  const [islamicOnly, setIslamicOnly] = useState(false);
  const rows = CMP_SAVINGS.filter(s => !islamicOnly || s.islamic).sort((a, b) => b.rmid - a.rmid);
  return (
    <>
      <div style={{ textAlign: "center", padding: "40px 0 16px" }}>
        <div className="fd-up" style={pill}>🏦 Compare Savings · সঞ্চয় হিসাব</div>
        <h1 className="fd-up fd-up-1" style={{ ...h1, fontSize: "clamp(26px,5.5vw,40px)" }}>Compare savings accounts in <span style={gradText}>Bangladesh</span></h1>
        <p className="fd-up fd-up-2" style={sub}>Regular savings-account interest rates across 10 banks — see at a glance where your everyday money works hardest.</p>
      </div>
      <UpdatedBadge />

      <div style={{ ...card, padding: "20px 18px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 16 }}>
          <input type="checkbox" checked={islamicOnly} onChange={e => setIslamicOnly(e.target.checked)} style={{ width: 17, height: 17, accentColor: T.accent }} />
          <span style={{ fontSize: 13.5, color: T.muted, fontWeight: 500 }}>Show only banks with a Shariah-compliant (Islamic) option 🕌</span>
        </label>
        <div style={{ overflowX: "auto", background: "rgba(8,18,36,0.5)", border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: "6px 12px" }}>
          <table className="fd-tbl">
            <thead><tr><th>Bank</th><th>Savings rate</th><th>Islamic</th><th>Source</th></tr></thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={s.bank}>
                  <td style={{ fontWeight: 600, color: "#EAF1FC" }}>{s.bank}{i === 0 && s.rmid > 0 && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: T.green }}>★ highest</span>}</td>
                  <td style={{ color: s.rmid < 0 ? T.faint : "#fff", fontWeight: 700 }}>{s.rate}<div style={{ fontSize: 10.5, color: T.faint, fontWeight: 500, marginTop: 2 }}>{s.note}</div></td>
                  <td>{s.islamic ? <span style={{ color: T.green }}>☪ yes</span> : <span style={{ color: T.faint }}>—</span>}</td>
                  <td style={{ color: T.faint, fontSize: 11.5 }}>{s.src}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...card, padding: "22px 20px", marginTop: 16 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#fff" }}>How BD savings interest works</h3>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: "#B8C7E0" }}>
          Bangladeshi savings accounts pay interest on a <b style={{ color: "#fff" }}>tiered, daily-balance</b> basis and usually credit it twice a year. Rates are low by design (0–4%) — well below the ~8.6% inflation rate — so a savings account is for liquidity and your emergency fund, <i>not</i> for growing wealth. For that, a DPS, FDR or Sanchayapatra pays far more. Banks marked "Islamic" run a separate Shariah (Mudaraba profit-sharing) savings product alongside the conventional one.
        </p>
      </div>

      <FAQ items={[
        { q: "Which bank has the highest savings rate?", a: "On the regular savings accounts published here, Premier Bank (~3–4%) and Bank Asia (2–3%) are at the top, while City Bank's general savings is the lowest (0–0.25%). Rates are tiered by balance, so your effective rate depends on how much you keep." },
        { q: "Is a savings account a good place to grow money?", a: "No. At 0–4%, a savings account loses purchasing power against ~8.6% inflation. Keep your emergency fund and short-term cash here, but move longer-term money to a DPS, FDR or Sanchayapatra — use the Save and Invest tools to see the difference." },
        { q: "Why do some banks show 'contact bank'?", a: "A few banks (DBBL, MTB, SouthEast) don't publish their regular-savings rate online — only their lending rates. Rather than guess, we show 'contact bank' so you can confirm the exact figure with them." },
      ]} />

      <div className="fd-up" style={{ marginTop: 26, background: "linear-gradient(135deg, rgba(79,158,255,0.16), rgba(8,18,36,0.9))", border: `1px solid ${T.accentBorder}`, borderRadius: 20, padding: "24px 22px", textAlign: "center" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 900, color: "#fff" }}>Make your savings actually grow</h3>
        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: T.muted, lineHeight: 1.65 }}>A DPS auto-deducts monthly and pays up to ~11%. See what yours grows to in the Save tool.</p>
        <button className="fd-cta" onClick={() => nav("/save")} style={{ ...cta, width: "auto", padding: "14px 26px" }}>Open the Save planner →</button>
      </div>
      <RelatedLinks links={[
        { label: "Save · DPS planner", path: "/save" },
        { label: "Sanchayapatra rates", path: "/sanchayapatra" },
        { label: "Compare loans", path: "/compare/loans" },
        { label: "Compare credit cards", path: "/compare/credit-cards" },
      ]} />
      <CompareDisclaimer />
    </>
  );
}

/* ---------- CREDIT CARD COMPARISON (card grid + multi-select compare) ---------- */
function CreditCardComparePage() {
  const nav = useNav();
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState([]);
  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : (s.length < 3 ? [...s, id] : s));
  const cards = CMP_CARDS.filter(c => filter === "all" || c.tags.includes(filter));
  const selCards = CMP_CARDS.filter(c => sel.includes(c.id));
  return (
    <>
      <div style={{ textAlign: "center", padding: "40px 0 16px" }}>
        <div className="fd-up" style={pill}>💳 Compare Credit Cards · ক্রেডিট কার্ড</div>
        <h1 className="fd-up fd-up-1" style={{ ...h1, fontSize: "clamp(26px,5.5vw,40px)" }}>Compare credit cards in <span style={gradText}>Bangladesh</span></h1>
        <p className="fd-up fd-up-2" style={sub}>Annual fees, interest rates and headline benefits across flagship cards — tick up to 3 to compare side by side. No sales calls.</p>
      </div>
      <UpdatedBadge />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {CARD_FILTERS.map(([k, label]) => (
          <button key={k} className="fd-chip" onClick={() => setFilter(k)} style={{ ...chip(filter === k), flex: "0 1 auto", padding: "9px 14px", fontSize: 12.5 }}>{label}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {cards.map((c, idx) => {
          const on = sel.includes(c.id);
          return (
            <div key={c.id} className={`fd-item fd-up fd-up-${Math.min(idx, 3)}`} onClick={() => toggle(c.id)} style={{ background: T.glass, border: `1px solid ${on ? T.accentBorder : T.border}`, borderRadius: 16, padding: "16px 17px", cursor: "pointer", backdropFilter: "blur(14px)", boxShadow: on ? `0 0 0 1px ${T.accentBorder}, 0 10px 30px rgba(79,158,255,0.15)` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: "#fff" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{c.bank}</div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: on ? T.accent : T.faint, whiteSpace: "nowrap" }}>{on ? "☑" : "☐"} Compare</span>
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
                <MetaPill>💳 {c.network}</MetaPill>
                <MetaPill>🧾 {c.fee}</MetaPill>
                <MetaPill>📈 APR {c.apr}</MetaPill>
              </div>
              <div style={{ fontSize: 12.5, color: "#C9D8F0", lineHeight: 1.5 }}>✦ {c.benefit}</div>
            </div>
          );
        })}
      </div>

      {selCards.length >= 2 && (
        <div className="fd-up" style={{ marginTop: 20 }}>
          <SectionHead title={`Comparing ${selCards.length} cards`} hint="Side by side" />
          <div style={{ overflowX: "auto", background: "rgba(8,18,36,0.5)", border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: "6px 12px" }}>
            <table className="fd-tbl">
              <thead><tr><th>Feature</th>{selCards.map(c => <th key={c.id}>{c.name}</th>)}</tr></thead>
              <tbody>
                <tr><td>Bank</td>{selCards.map(c => <td key={c.id}>{c.bank}</td>)}</tr>
                <tr><td>Network</td>{selCards.map(c => <td key={c.id}>{c.network}</td>)}</tr>
                <tr><td>Annual fee</td>{selCards.map(c => <td key={c.id} style={{ color: "#fff", fontWeight: 700 }}>{c.fee}</td>)}</tr>
                <tr><td>Interest (APR)</td>{selCards.map(c => <td key={c.id} style={{ color: "#fff", fontWeight: 700 }}>{c.apr}</td>)}</tr>
                <tr><td>Headline benefit</td>{selCards.map(c => <td key={c.id} style={{ fontSize: 11.5 }}>{c.benefit}</td>)}</tr>
                <tr><td>Rewards</td>{selCards.map(c => <td key={c.id} style={{ color: T.faint, fontSize: 11.5 }}>Contact bank</td>)}</tr>
              </tbody>
            </table>
          </div>
          <button className="fd-chip" onClick={() => setSel([])} style={{ ...chip(false), marginTop: 12, padding: "9px 16px", fontSize: 12.5 }}>Clear selection</button>
        </div>
      )}
      {selCards.length < 2 && <p style={{ fontSize: 12.5, color: T.faint, textAlign: "center", margin: "16px 0 0" }}>Tick 2–3 cards above to see them side by side.</p>}

      <FAQ items={[
        { q: "How do credit cards charge interest in Bangladesh?", a: "If you pay your full statement balance by the due date, most cards charge no interest (interest-free grace period). Carry a balance and interest applies — here roughly 18–25% per year, charged monthly on the outstanding amount. DBBL is the lowest in this set at 18%." },
        { q: "What is a fuel surcharge waiver?", a: "Card networks normally add a small surcharge (≈2%) on fuel-station transactions. A 'fuel surcharge waiver' means the bank refunds that surcharge, so filling up doesn't cost extra on the card. Availability varies by card — confirm with the bank." },
        { q: "Why don't you show cashback / reward rates?", a: "Bangladeshi banks publish card annual fees and interest rates, but generally do NOT publish their reward/cashback rates online — those depend on ongoing campaigns. We show fee, APR and network (which are official) and mark rewards 'contact bank' rather than guess." },
        { q: "Which card has the lowest cost?", a: "It depends on how you use it. If you sometimes carry a balance, the lowest APR matters most (DBBL, 18%). If you always pay in full, focus on the lowest annual fee and the perks you'll actually use (e.g. SouthEast Classic at ৳1,200)." },
      ]} />

      <RelatedLinks links={[
        { label: "Compare loans", path: "/compare/loans" },
        { label: "Compare savings accounts", path: "/compare/savings" },
        { label: "Money Blueprint", path: "/blueprint" },
        { label: "Where to invest", path: "/invest" },
      ]} />
      <CompareDisclaimer />
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
    /* keep the branded hero ("You've earned it. Now make it grow.") — unique <title>/meta still set per route for SEO */
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
  "/income-tax": {
    tab: null, view: "income-tax",
    title: "Bangladesh Income Tax Calculator FY 2025-26 & 2026-27 | FinDesh AI",
    desc: "Free Bangladesh income tax calculator for FY 2025-26 and FY 2026-27 — correct slabs, 15%/10% investment rebate, minimum tax, and a downloadable computation sheet PDF.",
  },
  "/tax-calculator": {
    tab: null, view: "income-tax",
    title: "Bangladesh Income Tax Calculator FY 2025-26 & 2026-27 | FinDesh AI",
    desc: "Free Bangladesh income tax calculator for FY 2025-26 and FY 2026-27 — correct slabs, 15%/10% investment rebate, minimum tax, and a downloadable computation sheet PDF.",
  },
  "/compare/credit-cards": {
    tab: null, view: "cmp-cards",
    title: "Compare Credit Cards in Bangladesh 2026 — Fees, APR & Benefits | FinDesh AI",
    desc: "Free side-by-side credit card comparison for Bangladesh — annual fees, interest rates (APR) and benefits across flagship cards. Tick up to 3 to compare.",
  },
  "/compare/savings": {
    tab: null, view: "cmp-savings",
    title: "Compare Savings Account Rates in Bangladesh 2026 | FinDesh AI",
    desc: "Free comparison of regular savings-account interest rates across 10 Bangladeshi banks — see where your everyday money earns the most, with Islamic options flagged.",
  },
  "/compare/loans": {
    tab: null, view: "cmp-loans",
    title: "Compare Loan Rates in Bangladesh 2026 — Personal, Home & Car | FinDesh AI",
    desc: "Free side-by-side comparison of personal, home and car loan rates across 10 strong Bangladeshi banks, plus a built-in EMI calculator.",
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
    /* Meta Pixel: the base snippet in index.html only fires on the first load,
       so SPA navigations must be tracked here or Ads only ever sees the landing
       page. Skipped on the first call for the same reason GA4 is. */
    fbTrack("PageView");
  }
  seoInitialized = true;
}

/* Meta Pixel helper — safe no-op if the pixel is blocked, still loading, or
   stripped by an ad blocker (very common), so tracking can never break the UI. */
function fbTrack(event, params) {
  try { if (typeof window.fbq === "function") window.fbq("track", event, params || {}); } catch (e) { /* no-op */ }
}
function fbTrackCustom(event, params) {
  try { if (typeof window.fbq === "function") window.fbq("trackCustom", event, params || {}); } catch (e) { /* no-op */ }
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
      { label: "Income Tax Calculator", icon: "🧾", path: "/income-tax" },
    ] },
    { heading: "Compare", items: [
      { label: "Compare Credit Cards", icon: "💳", path: "/compare/credit-cards" },
      { label: "Compare Savings Accounts", icon: "🏦", path: "/compare/savings" },
      { label: "Compare Loans", icon: "🤝", path: "/compare/loans" },
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
                    <a key={it.path} href={it.path} onClick={e => { e.preventDefault(); go(it.path); }} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 10px", borderRadius: 10, textDecoration: "none", background: active ? T.accentSoft : "transparent", color: active ? "#fff" : "#C9D8F0", fontSize: 14, fontWeight: 600, touchAction: "manipulation" }}>
                      <span style={{ fontSize: 16, pointerEvents: "none" }}>{it.icon}</span>
                      <span style={{ flex: 1, pointerEvents: "none" }}>{it.label}</span>
                      {it.soon && <span style={{ fontSize: 9.5, fontWeight: 800, color: T.amber, background: "rgba(255,180,84,0.12)", border: "1px solid rgba(255,180,84,0.3)", borderRadius: 20, padding: "2px 7px", letterSpacing: ".04em", pointerEvents: "none" }}>SOON</span>}
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
              touchAction: "manipulation",
            }}>
              <span style={{ fontSize: 16, pointerEvents: "none" }}>{t.icon}</span>
              <span style={{ pointerEvents: "none" }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 16px 40px", position: "relative", zIndex: 1 }}>
        {route.view === "income-tax" ? <IncomeTaxPage />
          : route.view === "sanchayapatra" ? <SanchayapatraPage />
          : route.view === "cmp-loans" ? <LoanComparePage />
          : route.view === "cmp-savings" ? <SavingsComparePage />
          : route.view === "cmp-cards" ? <CreditCardComparePage />
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
