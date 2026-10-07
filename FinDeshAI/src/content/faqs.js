/* ============================================================
   FAQ CONTENT for routes added Oct 2026 onward.
   Lives outside seo.js on purpose: seo.js is imported by the main bundle,
   but FAQ text is only needed (a) by the prerender script, to emit FAQPage
   JSON-LD, and (b) by the lazy page that displays it. Routes reference these
   arrays through a loader — faq: () => import("./content/faqs.js")… — so the
   text ships in the page's own chunk and never in the initial bundle.
   Page and JSON-LD still render from the SAME array, so they can't drift.
   ============================================================ */

/* /learn — rendered on the page and emitted as FAQPage JSON-LD from the same
   array. Every figure quoted here already appears, sourced and dated,
   elsewhere in the app; nothing new is introduced in these answers. */
export const LEARN_REVIEWED = "7 October 2026";
export const LEARN_FAQ = [
  { q: "Where should a beginner in Bangladesh start with money?", a: "In this order: build an emergency fund of three to six months of expenses, clear any high-interest debt such as a credit card balance, set up an automatic monthly saving like a DPS, and only then invest money you won't need for several years. Skipping the first two steps is what turns one bad month into an expensive loan." },
  { q: "Is a savings account enough to grow my money?", a: "No. Regular savings accounts in Bangladesh pay roughly 0–4%, while the inflation assumption FinDesh uses is about 8.6%. Money parked there loses buying power every year. Use it for day-to-day cash and your emergency fund, and move longer-term savings to a DPS, FDR or Sanchayapatra." },
  { q: "What is a real return?", a: "It's what your money earns after inflation. A rough way to see it is to subtract inflation from your rate: an FDR paying 10% with inflation near 8.6% gives a real return of only about 1.4%. If the result is negative, your savings are shrinking in real terms even though the balance is growing." },
  { q: "How much of my salary should I save?", a: "FinDesh's starting template for a Dhaka salaried professional is 20% to savings and investments, 55% to fixed costs, 20% to guilt-free spending and 5% to topping up your emergency fund. If rent makes that impossible, saving even 5–10% automatically matters more than the exact number." },
  { q: "Are mutual funds safe in Bangladesh?", a: "They are regulated, but they are not guaranteed. A mutual fund's value moves with the market: of the 20 largest open-end funds, five lost money in 2025, while the same group ranged from +7.0% to +23.1% in 2026 up to 3 September. Only money you can leave for several years belongs in a fund." },
  { q: "Should I pay off debt or invest first?", a: "Pay off high-interest debt first. Credit card interest in our comparison runs 18–25% a year, which is far more than any safe investment pays. Clearing a card balance is effectively a guaranteed return at that rate." },
  { q: "What is the rule of 72?", a: "A quick way to estimate how long money takes to double: divide 72 by the yearly return. At 12% a year money roughly doubles in 6 years; at 6% it takes about 12. It is an approximation, and it works best for rates between about 6% and 12%." },
  { q: "What is the difference between interest and profit (মুনাফা)?", a: "Conventional banks pay interest at a set rate. Sanchayapatra and many Islamic products use the word profit (মুনাফা); Islamic products earn it through profit-sharing rather than a fixed interest charge. For planning, both are the return on your money, but check how each product calculates it." },
  { q: "How up to date is the information on FinDesh?", a: "Every figure carries the date it was last checked. Bank, DPS, FDR and Sanchayapatra rates were last checked in June 2026, and mutual fund figures come from a 3 September 2026 snapshot. Rates change, so confirm with the institution before you commit money." },
  { q: "Does FinDesh give financial advice?", a: "No. FinDesh explains how Bangladeshi financial products work and lets you compare and calculate. It is general information, not tax or investment advice, and it doesn't know your full situation. For a decision that matters, confirm with the institution or a qualified adviser." },
];

/* ---------- /compare/* FAQs ----------
   Moved verbatim from the inline arrays on each compare page (Oct 2026) so
   the page and its FAQPage JSON-LD render from one array, and the /faq hub can
   reuse them. Two values that used to be interpolated are now literal:
   "June 2026" (= CMP_UPDATED) and "five" (= funds with a negative 2025 return
   in CMP_MUTUAL_FUNDS). Update them here if those change. */
export const LOANS_FAQ = [
  { q: "Flat rate vs reducing-balance — what's the difference?", a: "On a reducing-balance loan, interest is charged only on the outstanding balance, which falls every month — so the true cost is much lower than the same headline number quoted 'flat'. Bangladeshi banks quote these consumer loans on a reducing-balance basis. Always ask which method applies." },
  { q: "Why is one bank's personal-loan rate so much higher?", a: "Unsecured personal loans are priced for risk and vary widely (here, roughly 10% to 18%). A loan secured against your salary, FDR or DPS is usually far cheaper. The rate you're offered also depends on your income, employer and credit history." },
  { q: "How is my monthly EMI calculated?", a: "EMI = P × r × (1+r)ⁿ ÷ ((1+r)ⁿ − 1), where P is the loan amount, r the monthly rate and n the number of months. Use the calculator above to see your EMI, total interest and a year-by-year breakdown." },
  { q: "Are these rates final?", a: "No — they're the banks' published bands as of June 2026. Banks reprice periodically and your personal offer may differ. Confirm directly before applying." },
];

export const SAVINGS_CMP_FAQ = [
  { q: "Which bank has the highest savings rate?", a: "On the regular savings accounts published here, Premier Bank (~3–4%) and Bank Asia (2–3%) are at the top, while City Bank's general savings is the lowest (0–0.25%). Rates are tiered by balance, so your effective rate depends on how much you keep." },
  { q: "Is a savings account a good place to grow money?", a: "No. At 0–4%, a savings account loses purchasing power against ~8.6% inflation. Keep your emergency fund and short-term cash here, but move longer-term money to a DPS, FDR or Sanchayapatra — use the Save and Invest tools to see the difference." },
  { q: "Why do some banks show 'contact bank'?", a: "A few banks (DBBL, MTB, SouthEast) don't publish their regular-savings rate online — only their lending rates. Rather than guess, we show 'contact bank' so you can confirm the exact figure with them." },
];

export const CARDS_FAQ = [
  { q: "How do credit cards charge interest in Bangladesh?", a: "If you pay your full statement balance by the due date, most cards charge no interest (interest-free grace period). Carry a balance and interest applies — here roughly 18–25% per year, charged monthly on the outstanding amount. DBBL is the lowest in this set at 18%." },
  { q: "What is a fuel surcharge waiver?", a: "Card networks normally add a small surcharge (≈2%) on fuel-station transactions. A 'fuel surcharge waiver' means the bank refunds that surcharge, so filling up doesn't cost extra on the card. Availability varies by card — confirm with the bank." },
  { q: "Why don't you show cashback / reward rates?", a: "Bangladeshi banks publish card annual fees and interest rates, but generally do NOT publish their reward/cashback rates online — those depend on ongoing campaigns. We show fee, APR and network (which are official) and mark rewards 'contact bank' rather than guess." },
  { q: "Which card has the lowest cost?", a: "It depends on how you use it. If you sometimes carry a balance, the lowest APR matters most (DBBL, 18%). If you always pay in full, focus on the lowest annual fee and the perks you'll actually use (e.g. SouthEast Classic at ৳1,200)." },
];

export const MF_FAQ = [
  { q: "Are mutual fund returns guaranteed in Bangladesh?", a: "No. Every figure on this page is historical. Of the 20 largest open-end funds, five lost money during 2025 even though most gained during 2026. If you need a fixed, promised return, Sanchayapatra, a bank DPS or an FDR are the right instruments — see our Save and Sanchayapatra pages." },
  { q: "What is NAV?", a: "Net Asset Value is the per-unit value of everything the fund owns, minus what it owes, divided by the number of units. It's the honest price of one unit. Open-end funds are bought and sold at prices set around NAV, so a rising NAV means the fund's holdings gained value." },
  { q: "How much do I need to start?", a: "It varies by asset management company and isn't published in one verifiable place, so we don't list it — confirm directly with the AMC. As a rule, open-end funds in Bangladesh start far lower than most people assume, often within reach of a few thousand taka." },
  { q: "Mutual fund or DPS — which should I choose?", a: "Different jobs. A DPS pays a contracted rate (up to ~11%) and is the right home for money you'll need in a few years. A mutual fund has no promised rate and should only hold money you can leave for 5+ years. Many people do both: DPS for the emergency and near-term goals, funds for long-term growth." },
  { q: "Which funds are Shariah-compliant?", a: "Funds registered as Shariah funds include the IDLC AML Shariah Fund and the Shanta Amanah Shariah Fund. Use the Shariah-only filter above to see them. Confirm the certification and the screening methodology with the asset manager before investing." },
];

/* ---------- /guides/* FAQs ----------
   Rendered on each guide and emitted as its FAQPage JSON-LD. Figures are the
   app's own dated values, written out as literals because JSON-LD can't
   interpolate: Sanchayapatra 11.83% (5-year), FDR 9–11.5%, DPS up to 11%,
   savings accounts 0–4% (all June 2026); fund data 3 September 2026. Update
   these if INSTRUMENTS / SAVINGS / CMP_SAVINGS / CMP_MUTUAL_FUNDS change. */
export const GUIDE_REVIEWED = "8 October 2026";

export const GUIDE_DEPOSITS_FAQ = [
  { q: "Which pays more: FDR, DPS or Sanchayapatra?", a: "On the rates FinDesh lists (June 2026), the 5-year Sanchayapatra pays 11.83%, bank FDRs 9–11.5% and the best bank DPS schemes up to about 11%. All three are before source tax, and rates change, so confirm the current figure with the bank or the Department of National Savings." },
  { q: "Can I put a lump sum into a DPS?", a: "Not really. A DPS is built for a fixed monthly deposit over several years. For money you already have, the choice is usually an FDR or a Sanchayapatra; a DPS suits saving from your salary each month." },
  { q: "Is Sanchayapatra safer than an FDR?", a: "Sanchayapatra is issued by the government, so it carries government backing. An FDR or DPS is only as safe as the bank that holds it, which is why it matters which bank you choose. Both lock your money: cashing out early usually pays less than the listed rate." },
];

export const GUIDE_COMPARE_MF_FAQ = [
  { q: "Is a mutual fund with a lower NAV cheaper?", a: "No. NAV is just the value of one unit, and it depends mostly on the price the fund launched at and how it has performed and paid out since. A fund with a ৳15 NAV is not cheaper than one at ৳200; what matters is how the value changes over time, the costs, and what the fund holds." },
  { q: "Which return should I look at when comparing funds?", a: "Look at more than one period. FinDesh shows each fund's 2026 return so far and its full-year 2025 return, from the same dated source. A fund that tops one period and trails in the other is telling you its results swing, and neither number is a promise for next year." },
];

export const GUIDE_NAV_FAQ = [
  { q: "Why does the same fund show a different NAV on two websites?", a: "Usually because they were updated on different dates, or are quoting different prices: the NAV itself, the selling price you pay, or the repurchase price the fund pays you back. Some sources also show NAV at cost rather than at market value. Check the date and the column name before comparing." },
  { q: "Do I buy an open-end fund at its NAV?", a: "You buy at the fund's selling price and sell back at its repurchase price, both set by the fund manager around the NAV. The gap between the two is a cost of buying and selling. Listed closed-end funds are different: they trade on the stock exchange at a market price that can sit above or below NAV." },
];

export const GUIDE_EMERGENCY_FAQ = [
  { q: "How big should my emergency fund be?", a: "FinDesh suggests three months of your essential expenses as a bare minimum, six months as the target, and up to twelve if your income is irregular or you support family. Use your real monthly spending, including rent, EMIs and money you send home." },
  { q: "Where should I keep my emergency fund in Bangladesh?", a: "Somewhere you can reach in a few days but won't spend by accident: a separate savings account, or a short auto-renewing FDR at a strong bank. Not Sanchayapatra, which is designed to be held for years, and not your everyday mobile wallet." },
  { q: "Should I invest my emergency fund to beat inflation?", a: "No. Its job is to be there, at full value, in a bad month. Accept a lower return on this money and invest only what sits beyond it. Top the fund up once a year so it keeps pace with your rising expenses." },
];
