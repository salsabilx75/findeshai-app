/* ============================================================
   MUTUAL FUND RETURN CALCULATOR — reduced, honest version.
   Replays the two NAV-based period returns the source publishes per fund:
     · 2026 year-to-date (1 Jan → 3 Sep 2026, the snapshot date)
     · full calendar year 2025
   and nothing else. No 1/3/5-year or since-launch figures, no SIP/IRR,
   no projection — the source doesn't publish the NAV history those need.

   No dividend-reinvest toggle: the source gives each fund's LATEST dividend
   only (no payout dates or history), and doesn't say whether its period
   returns already include dividends. Modelling reinvestment would be a guess.

   Deposit comparisons are simple interest pro-rated to the same number of
   days, before source tax, at editable rates. For the 2025 period the
   defaults are today's rates — FinDesh holds no verified 2025 rates.
   ============================================================ */
import { useEffect, useMemo, useState } from "react";
import {
  T, card, lbl, bigInput, taka, chip, taxTrack,
  INFLATION, LAST_UPDATED, INSTRUMENTS, SAVINGS, CMP_MUTUAL_FUNDS, MF_UPDATED, MF_SOURCE_URL,
} from "../App.jsx";
import { useDebounced, toAmount, takaSigned } from "../hooks.js";

const day = s => new Date(s + "T00:00:00Z").getTime();
const PERIODS = {
  ytd: { label: "Since 1 Jan 2026", sub: `to ${MF_UPDATED}`, key: "ytd", days: Math.round((day("2026-09-03") - day("2026-01-01")) / 864e5), endLabel: `on ${MF_UPDATED}` },
  y2025: { label: "Full year 2025", sub: "1 Jan – 31 Dec 2025", key: "prev", days: 365, endLabel: "on 31 Dec 2025" },
};
const SP5 = INSTRUMENTS.find(i => i.id === "sanchayapatra") || { rate: 11.83 };
const FDR = INSTRUMENTS.find(i => i.id === "fdr") || { rate: 10, rateLabel: "9–11.5%" };
const DPS_RATES = SAVINGS.filter(s => s.id !== "postal").map(s => s.rate);
const DPS_DEFAULT = Math.round((DPS_RATES.reduce((a, b) => a + b, 0) / DPS_RATES.length) * 2) / 2; // average of listed DPS rates, to the nearest 0.5

const FUNDS = CMP_MUTUAL_FUNDS.map(f => ({ ...f, id: f.fund }));
const pctS = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + "%";
const col = v => (v < 0 ? T.red : v > 0 ? T.green : T.muted);
const median = arr => { const a = [...arr].sort((x, y) => x - y), m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };

function RateInput({ value, onChange, label }) {
  return (
    <input className="fd-input" value={value} onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label={label + " rate % per year"}
      style={{ width: 64, padding: "6px 8px", fontSize: 13, fontWeight: 700, color: "var(--c-fff)", textAlign: "right", border: "1px solid var(--c-148-180-255-22)", borderRadius: 8, background: "var(--c-8-18-36-7)", fontFamily: "inherit", outline: "none" }} />
  );
}

export default function MFCalculator() {
  const [amt, setAmt] = useState("100000");
  const [fundId, setFundId] = useState("all");
  const [periodId, setPeriodId] = useState("ytd");
  const [rates, setRates] = useState({ sp: String(SP5.rate), fdr: String(FDR.rate), dps: String(DPS_DEFAULT) });
  const dAmt = useDebounced(amt, 250);
  const dRates = useDebounced(rates, 300);
  const P = PERIODS[periodId];

  useEffect(() => { taxTrack("mf_calc_used", { period: periodId, fund: fundId === "all" ? "all" : "one" }); }, [periodId, fundId]);

  const r = useMemo(() => {
    const amount = toAmount(dAmt);
    const ranked = FUNDS.map(f => {
      const ret = f[P.key];
      return { ...f, ret, value: amount * (1 + ret / 100), gain: amount * ret / 100 };
    }).sort((a, b) => b.ret - a.ret);
    const rets = ranked.map(x => x.ret);
    const one = fundId === "all" ? null : ranked.find(x => x.id === fundId);
    const dep = (rate) => { const n = Number(rate); return isFinite(n) && n >= 0 ? amount * (Math.min(n, 40) / 100) * P.days / 365 : null; };
    const deposits = [
      { k: "sp", name: "Sanchayapatra (5-year)", note: "Government-guaranteed. Profit before 5–10% source tax.", gain: dep(dRates.sp) },
      { k: "fdr", name: "FDR", note: `Listed range ${FDR.rateLabel}. Profit before 10–15% source tax.`, gain: dep(dRates.fdr) },
      { k: "dps", name: "DPS-level rate", note: "A DPS is a monthly scheme; this applies its rate to your lump sum for comparison only.", gain: dep(dRates.dps) },
    ];
    const inflationNeed = amount * (INFLATION / 100) * P.days / 365;
    return { amount, ranked, one, best: rets[0], worst: rets[rets.length - 1], med: median(rets), losers: rets.filter(x => x < 0).length, deposits, inflationNeed };
  }, [dAmt, fundId, periodId, dRates]); // eslint-disable-line react-hooks/exhaustive-deps

  const fundRows = r.one
    ? [{ name: r.one.fund, sub: "the fund you picked", ret: r.one.ret }]
    : [{ name: "Best of the 20 funds", sub: r.ranked[0].fund, ret: r.best }, { name: "Median fund", sub: "the middle outcome", ret: r.med }, { name: "Worst of the 20 funds", sub: r.ranked[r.ranked.length - 1].fund, ret: r.worst }];

  const rowStyle = { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.borderSoft}` };
  return (
    <section id="mf-calculator" aria-labelledby="mf-calc-h" className="fd-up" style={{ ...card, padding: "22px 18px", marginTop: 18, scrollMarginTop: 170 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.amber, letterSpacing: ".09em", marginBottom: 6 }}>🧮 PAST-RETURN CALCULATOR · NOT A FORECAST</div>
      <h2 id="mf-calc-h" style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 900, color: "var(--c-fff)", letterSpacing: "-0.01em" }}>What would ৳X have become?</h2>
      <p style={{ margin: "0 0 16px", fontSize: 13.5, lineHeight: 1.65, color: "var(--c-b8c7e0)" }}>Replays each fund's published return for one fixed period, next to what guaranteed options would have paid over the same days. It tells you how wide the range was — not what happens next.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <div>
          <label style={lbl} htmlFor="mfc-amt">Amount invested</label>
          <div style={{ position: "relative" }}><span style={{ ...taka, fontSize: 18, left: 14 }}>৳</span>
            <input id="mfc-amt" className="fd-input" value={amt} onChange={e => setAmt(e.target.value.replace(/[^0-9,]/g, ""))} inputMode="numeric" style={{ ...bigInput, fontSize: 18, padding: "12px 14px 12px 36px" }} /></div>
        </div>
        <div>
          <label style={lbl} htmlFor="mfc-fund">Fund</label>
          <select id="mfc-fund" className="fd-input" value={fundId} onChange={e => setFundId(e.target.value)}
            style={{ width: "100%", padding: "13px 12px", fontSize: 14, fontWeight: 600, color: "var(--c-fff)", border: "1.5px solid var(--c-148-180-255-18)", borderRadius: 14, background: "var(--c-8-18-36-85)", fontFamily: "inherit" }}>
            <option value="all">All 20 funds — show the range</option>
            {[...FUNDS].sort((a, b) => a.fund.localeCompare(b.fund)).map(f => <option key={f.id} value={f.id}>{f.fund}</option>)}
          </select>
        </div>
      </div>
      <label style={{ ...lbl, marginTop: 14 }}>Period</label>
      <div role="radiogroup" aria-label="Period" style={{ display: "flex", gap: 8 }}>
        {Object.entries(PERIODS).map(([id, p]) => (
          <button key={id} role="radio" aria-checked={periodId === id} className="fd-chip" onClick={() => setPeriodId(id)}
            style={{ ...chip(periodId === id), padding: "10px 8px", textAlign: "center", lineHeight: 1.3, touchAction: "manipulation" }}>
            <span style={{ display: "block", fontWeight: 800 }}>{p.label}</span>
            <span style={{ display: "block", fontSize: 10.5, opacity: "var(--fd-dim-8)" }}>{p.sub}</span>
          </button>
        ))}
      </div>

      {r.amount > 0 && (
        <>
          {/* --- headline: chosen fund, or the range --- */}
          {r.one ? (
            <div style={{ marginTop: 16, background: "var(--c-8-18-36-55)", border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>{r.one.fund} · {P.label.toLowerCase()}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 22px", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, color: T.faint }}>Invested <b style={{ color: "var(--c-c9d8f0)" }}>{takaSigned(r.amount)}</b></span>
                <span style={{ fontSize: 13, color: T.faint }}>Worth {P.endLabel} <b style={{ color: "var(--c-fff)", fontSize: 18 }}>{takaSigned(r.one.value)}</b></span>
                <span style={{ fontSize: 15, fontWeight: 800, color: col(r.one.ret) }}>{takaSigned(r.one.gain, true)} ({pctS(r.one.ret)})</span>
              </div>
              {parseFloat(r.one.exitLoad) > 0 && <p style={{ margin: "8px 0 0", fontSize: 11.5, color: T.faint }}>This fund's exit load in the snapshot is {r.one.exitLoad}: selling would return roughly that share less than the value shown. Not deducted above.</p>}
            </div>
          ) : (
            <div style={{ marginTop: 16, background: "var(--c-255-180-84-06)", border: "1px solid var(--c-255-180-84-26)", borderRadius: 14, padding: "12px 14px", fontSize: 13, lineHeight: 1.6, color: "var(--c-ffce8a)" }}>
              Over {P.label.toLowerCase()}, the same {takaSigned(r.amount)} ended anywhere from <b style={{ color: "var(--c-fff)" }}>{takaSigned(r.amount * (1 + r.worst / 100))}</b> to <b style={{ color: "var(--c-fff)" }}>{takaSigned(r.amount * (1 + r.best / 100))}</b> depending on the fund{r.losers ? <> — and <b style={{ color: "var(--c-fff)" }}>{r.losers} of the 20 lost money</b></> : null}.
            </div>
          )}

          {/* --- side by side: funds vs guaranteed options, same days --- */}
          <h3 style={{ margin: "20px 0 4px", fontSize: 14, fontWeight: 800, color: "var(--c-fff)" }}>Same {takaSigned(r.amount)}, same {P.days} days</h3>
          <p style={{ margin: "0 0 6px", fontSize: 11.5, color: T.faint }}>Edit any rate. Deposit figures are simple interest, pro-rated, before tax.{periodId === "y2025" && <> <b style={{ color: T.amber }}>These defaults are {LAST_UPDATED} rates — FinDesh doesn't hold verified 2025 rates, so change them if you know what you were offered.</b></>}</p>
          <div>
            {fundRows.map(f => (
              <div key={f.name} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--c-eaf1fc)" }}>{f.name} <span style={{ fontSize: 9.5, fontWeight: 800, color: T.amber, letterSpacing: ".04em" }}>PAST PERF.</span></div>
                  <div style={{ fontSize: 11, color: T.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.sub} · {pctS(f.ret)}</div>
                </div>
                <b style={{ fontSize: 14, color: col(f.ret), whiteSpace: "nowrap" }}>{takaSigned(r.amount * f.ret / 100, true)}</b>
              </div>
            ))}
            {r.deposits.map(d => (
              <div key={d.k} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--c-eaf1fc)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {d.name}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: T.muted, fontWeight: 600 }}>
                      <RateInput value={rates[d.k]} label={d.name} onChange={v => setRates(s => ({ ...s, [d.k]: v }))} />% / yr
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: T.faint, lineHeight: 1.45, marginTop: 2 }}>{d.note}</div>
                </div>
                <b style={{ fontSize: 14, color: d.gain == null ? T.faint : T.green, whiteSpace: "nowrap" }}>{d.gain == null ? "—" : takaSigned(d.gain, true)}</b>
              </div>
            ))}
            <div style={{ ...rowStyle, borderBottom: "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.amber }}>Needed just to keep pace with prices</div>
                <div style={{ fontSize: 11, color: T.faint }}>FinDesh's single inflation assumption: ~{INFLATION}% a year (an assumption, from early-2026 figures)</div>
              </div>
              <b style={{ fontSize: 14, color: T.amber, whiteSpace: "nowrap" }}>{takaSigned(r.inflationNeed, true)}</b>
            </div>
          </div>

          {/* --- ranked table of all 20 --- */}
          <details style={{ marginTop: 14 }} open={!r.one}>
            <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--c-8ac2ff)", padding: "6px 0" }}>All 20 funds ranked for this period</summary>
            <div style={{ overflowX: "auto", marginTop: 8, background: "var(--c-8-18-36-5)", border: `1px solid ${T.borderSoft}`, borderRadius: 12 }}>
              <table className="fd-tbl" style={{ minWidth: 470 }}>
                <thead><tr><th style={{ paddingLeft: 12 }}>#&nbsp; Fund</th><th>Return</th><th>Worth {P.endLabel}</th><th>Gain / loss</th></tr></thead>
                <tbody>
                  {r.ranked.map((f, i) => {
                    const mine = r.one && f.id === r.one.id;
                    return (
                      <tr key={f.id} style={mine ? { background: "var(--c-79-158-255-1)" } : undefined}>
                        <td style={{ paddingLeft: 12, whiteSpace: "normal", minWidth: 170 }}><span style={{ color: T.faint, marginRight: 6 }}>{i + 1}</span><span style={{ color: "var(--c-eaf1fc)", fontWeight: mine ? 800 : 600 }}>{f.fund}</span></td>
                        <td style={{ color: col(f.ret), fontWeight: 700 }}>{pctS(f.ret)}</td>
                        <td style={{ color: "var(--c-c9d8f0)" }}>{takaSigned(f.value)}</td>
                        <td style={{ color: col(f.ret), fontWeight: 700 }}>{takaSigned(f.gain, true)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}

      <div style={{ marginTop: 16, background: "var(--c-8-18-36-5)", border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px" }}>
        <p style={{ margin: "0 0 6px", fontSize: 12, lineHeight: 1.6, color: "var(--c-c9d8f0)" }}><b style={{ color: "var(--c-fff)" }}>What this is:</b> each fund's published NAV-based return for one fixed period, applied to your amount as if you'd invested on the first day.</p>
        <p style={{ margin: "0 0 6px", fontSize: 12, lineHeight: 1.6, color: "var(--c-c9d8f0)" }}><b style={{ color: "var(--c-fff)" }}>What it isn't:</b> a forecast, a 1-year or 3-year return, or advice. A fund's next period can look nothing like these.</p>
        <p style={{ margin: "0 0 6px", fontSize: 12, lineHeight: 1.6, color: "var(--c-c9d8f0)" }}><b style={{ color: "var(--c-fff)" }}>Not included:</b> entry and exit loads, tax, fees, and dividends paid out — the source doesn't state whether its returns include them, and gives no payout dates, so we don't model reinvestment.</p>
        <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.6, color: T.faint }}>Source: LankaBangla Weekly Open End Mutual Fund Review (compiled from UCB Stock Brokerage), {MF_UPDATED} — <a href={MF_SOURCE_URL} target="_blank" rel="noopener noreferrer" style={{ color: T.accent, textDecoration: "none" }}>view ↗</a>. Deposit defaults: Sanchayapatra {SP5.rate}% (5-year, Jan 2026 revision); FDR {FDR.rate}%, FinDesh's mid estimate within the {FDR.rateLabel} listed for strong banks; DPS {DPS_DEFAULT}%, the average of the DPS rates listed in FinDesh, rounded ({LAST_UPDATED}).</p>
      </div>
    </section>
  );
}
