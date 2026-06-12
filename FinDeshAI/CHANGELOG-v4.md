# FinDesh AI v4 — Change Summary (June 2026)

All rates researched and verified June 2026. v3 design, logic and calculators untouched — only additions and data updates.

## How to deploy (one-time, 2 minutes)

Your app currently imports `findeshai-app-v3.jsx`, so dropping v4 in alone won't switch it. On GitHub (web):

1. Upload `findeshai-app-v4.jsx` into `src/`
2. Open `src/main.jsx` (or wherever the app is imported) and change the import line to `./findeshai-app-v4.jsx` — one-line edit, commit
3. Replace root `index.html` with the new one (SEO version — entry script path `/src/main.jsx` kept identical)
4. Upload `sitemap.xml`, `robots.txt`, `_redirects` into `public/`
5. In Netlify → Site settings → Environment variables, make sure `VITE_GEMINI_KEY` is set (needed for the Borrow tab AI insight; without it, a built-in rule-based insight is shown instead — nothing breaks)

Netlify auto-builds on commit; the new version goes live. After this one-time import switch, future versions only need step 1–2's upload.

⚠️ `index.html` goes in the **repo root** (Vite convention), NOT in `public/` — putting an index.html inside `public/` would overwrite the built one and break the site.

## Tab 1 — Invest (updated rates + 3 new instruments)

| Item | v3 | v4 (verified Jun 2026) |
|---|---|---|
| Inflation constant | 8.5% | **8.6%** (8.58% pt-to-pt Jan 2026) |
| 5-yr Sanchayapatra | 11.83% | 11.83% confirmed + tier note (11.80% above ৳7.5L, Jan 2026 revision) |
| Paribar | 11.93% | 11.93% confirmed + tier note |
| **Pensioner Sanchayapatra** | — | **NEW · 11.98%** (highest NSC rate) |
| **3-Month Profit Sanchayapatra** | — | **NEW · 11.82%**, 3-yr term, quarterly payout |
| **Wage Earner Dev. Bond** | — | **NEW · 9–12% tiered, tax-free**, remitters only |
| FDR | 9–10% | **9–11.5%**, weak-bank warning added |
| Treasury bill/bond | 10–12% | **9.5–10.2%** (91-day ~9.5%, 10-yr ~10.2%, trending down) |
| Blue-chip / DSEX | "up ~15%" | **DSEX ~5,483, +14.8% over 12 months** |
| Gold | 10–15% | **~৳2.2 Lakh/bhori, +28% YoY** noted; long-run 10–15% kept for projections |
| iFarmer | unconditional | **Flagged**: retail lots open intermittently (shifted toward institutional financing) — verify in app |
| Mutual funds | generic | Added guidance to compare weekly NAV on dsebd.org. A verified "top 5 by NAV" list wasn't reliably publishable from public data, so per your instruction it was flagged rather than invented |
| "Last updated: June 2026" badge | — | **Added** (visible on Invest, Save and Borrow) |

## Tab 2 — Save (rebuilt list, Nagad removed)

- **Removed:** Nagad (per instruction), generic "Bank MSS" card, and the old Islamic DPS card that named **Islami Bank and SIBL** (both excluded — Islami Bank is under deposit-run stress June 2026; SIBL merged into the state rescue entity)
- **Added bank-specific DPS cards:** ONE Bank PENSAVE/EDUSAVE (up to 11%), Midland Digital DPS (up to 10.5%, fully online), EBL DPS incl. Women's Confidence + insurance cover (9.5–10.5%), DBBL Deposit Plus (up to 9.5%)
- **bKash DPS updated:** 9–10%, verified partners (BRAC, IDLC, Dhaka Bank, MTB, City Islamic), weekly DPS from ৳250 noted, Islamic option via City Islamic/Dhaka Bank
- **New Islamic DPS card:** City Islamic + Dhaka Bank Islamic (healthy banks only)
- Postal savings confirmed ~11.8%. Both modes, goal chips, Shariah filter and all calculator logic unchanged

## Tab 3 — Borrow (NEW, replaces "coming soon")

- **Live EMI calculator:** amount chips (৳1L–৳50L), editable rate (pre-filled 12.5% BD average), 1–20 yr tenure, instant updates, big EMI display with animated counter, total paid / total interest / interest-vs-principal stats, principal-vs-interest bar, collapsible year-by-year amortization table
- **"Is this loan worth it?" AI insight** via Gemini using `import.meta.env.VITE_GEMINI_KEY` (no hardcoded key; graceful rule-based fallback if key missing or API fails)
- **Lender comparison:** 9 screened lenders (DBBL, BRAC, EBL, City, HSBC, DBH Finance, Prime, Shahjalal Islami, City Islamic), filter by Personal/Home/Car/Islamic, sorted lowest rate first, expandable cards with fees/eligibility/links, Shariah products flagged (Murabaha/HPSM/Ijarah)
- Researched context baked in: policy rate 10%, personal 12–15%, home 10–13%, car LTV capped 50%, ৳20L unsecured cap. All bank rate bands marked indicative with "get a formal rate letter" note

## Tab 4 — Blueprint (NEW, replaces "coming soon")

Guide-style page (IWT/Ramit Sethi framework adapted to BD):
- **The BD Money System** — 6 numbered steps: know your numbers → emergency fund → salary automation (standing instructions + bKash auto-deduct) → kill high-interest debt → invest in order (NSC → FDR/DPS → iFarmer → mutual funds → stocks, with BD reasoning) → grow income (freelancing in USD, side business, certifications)
- **BD Conscious Spending Plan** — 55/20/20/5 starting split with Dhaka cost-of-living reality checks
- **10 BD Money Mistakes** — card grid
- **3 interactive calculators embedded in the guide:** emergency fund (3/6/12-month targets + where to park), salary split (taka amounts + visual bar), inflation pass/fail checker (vs 8.6%)

## SEO (Task 5)

- `index.html` (repo root): optimized title, 152-char meta description, keywords (EN+বাংলা), canonical, robots, OG + Twitter cards, og:image → `/og-image.png` placeholder, `lang="en"`, JSON-LD **WebApplication** + **FAQPage with 10 Q&As** (7 English + 3 Bengali) targeting all requested keywords. Your favicon and entry script preserved.
- `public/sitemap.xml`, `public/robots.txt` — as specified
- `public/_redirects` (bonus) — Netlify SPA rule so `/save`, `/borrow`, `/blueprint` URLs from the sitemap load the app instead of 404

## Verified in final review

EMI formula hand-checked (৳10L @12.5% ×5yr = ৳22,497/mo ✓) · Nagad: 0 mentions · no troubled bank recommended anywhere · no hardcoded API keys · all four tabs use the same v3 nav shell · all layouts flex-wrap/auto-fit for mobile · disclaimer on every tab + footer · inflation 8.6% everywhere.
