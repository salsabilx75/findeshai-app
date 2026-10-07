/* ============================================================
   COMPARE KIT — one shared set of pieces for every /compare/* page,
   so the four tables behave identically and are fixed in one place.

   - useCompareUrl   filter/sort/selection state mirrored in the URL
                     (?sort=…&q=…&sel=…) so a copied link restores the view.
                     Only choices go in the URL — never amounts or anything
                     personal.
   - seededShuffle   default order is shuffled per visit (no implied ranking);
                     the seed rides along in copied links so the recipient
                     sees the same order.
   - CompareToolbar  search, provider pills, sort popover, copy-link.
   - CompareTable    sticky header row + pinned first column (inside a
                     height-capped scroll box — the only way sticky headers
                     coexist with horizontal scroll), "?" tooltips on jargon
                     headers, relative bars in numeric cells, a subtle
                     highest/lowest marker, "as of" stamp, report-an-issue
                     and methodology links.
   - SidePicker      2–3 slot side-by-side comparison.
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import { T, chip, taxTrack, useNav, CONTACT_EMAIL } from "../App.jsx";
import { ROUTES } from "../seo.js";
import { useDebounced } from "../hooks.js";

const NAVY = "#0A1628"; // brand Deep Navy — opaque so scrolled content doesn't show through pinned cells

/* ---------- helpers ---------- */
export const slug = s => String(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function mulberry32(a) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function seededShuffle(arr, seed) {
  const rnd = mulberry32(seed), a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* State mirrored into the query string with replaceState (no history spam).
   `defaults` lists every key the page uses; values equal to the default are
   left out of the URL so a plain visit keeps a clean address. */
export function useCompareUrl(defaults) {
  const [state, setState] = useState(() => {
    const q = new URLSearchParams(window.location.search), s = { ...defaults };
    Object.keys(defaults).forEach(k => { if (q.has(k)) s[k] = q.get(k); });
    return s;
  });
  /* Seed: from a shared link if present, otherwise fresh for this visit. */
  const [seed] = useState(() => {
    const q = new URLSearchParams(window.location.search).get("seed");
    return q && /^\d+$/.test(q) ? Number(q) : Math.floor(Math.random() * 1e9);
  });
  useEffect(() => {
    const q = new URLSearchParams();
    Object.entries(state).forEach(([k, v]) => { if (v !== "" && v != null && v !== defaults[k]) q.set(k, v); });
    const qs = q.toString();
    try { window.history.replaceState(window.history.state, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash); } catch (_) { /* no-op */ }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setState(s => ({ ...s, [k]: v }));
  return [state, set, seed];
}
export const listParam = v => (v ? String(v).split(",").filter(Boolean) : []);

/* ---------- small UI ---------- */
function SortPopover({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const label = (options.find(o => o.id === value) || options[0]).label;
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button className="fd-chip" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(o => !o)}
        style={{ ...chip(open), flex: "0 0 auto", minWidth: 0, padding: "9px 13px", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", touchAction: "manipulation" }}>
        <span style={{ color: T.faint, fontWeight: 600 }}>Sort:</span><span style={{ fontWeight: 700 }}>{label}</span><span style={{ fontSize: 9, opacity: .8 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div role="listbox" style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 41, minWidth: 210, background: "#0A1220", border: `1px solid ${T.border}`, borderRadius: 12, padding: 6, boxShadow: "0 18px 50px rgba(0,0,0,0.55)" }}>
            {options.map(o => {
              const on = o.id === value;
              return (
                <button key={o.id} role="option" aria-selected={on} onClick={() => { onChange(o.id); setOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "10px", borderRadius: 9, border: "none", background: on ? T.accentSoft : "transparent", color: on ? "#fff" : "#C9D8F0", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", touchAction: "manipulation" }}>
                  <span style={{ width: 12, flexShrink: 0, color: T.accent }}>{on ? "✓" : ""}</span>{o.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function CopyLink({ page, seed, sort }) {
  const [msg, setMsg] = useState("");
  const [fallback, setFallback] = useState("");
  const copy = async () => {
    const u = new URL(window.location.href);
    u.hash = "";
    if (sort === "shuffle") u.searchParams.set("seed", String(seed));
    const link = u.toString();
    taxTrack("compare_link_copied", { page });
    try { await navigator.clipboard.writeText(link); setMsg("Link copied"); setFallback(""); }
    catch (_) { setFallback(link); setMsg(""); }
    setTimeout(() => setMsg(""), 2200);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <button className="fd-chip" onClick={copy} style={{ ...chip(!!msg), flex: "0 0 auto", minWidth: 0, padding: "9px 13px", whiteSpace: "nowrap", touchAction: "manipulation" }}>
        {msg ? "✓ " + msg : "🔗 Copy link to this comparison"}
      </button>
      {fallback && <input readOnly value={fallback} onFocus={e => e.target.select()} aria-label="Link to this comparison" style={{ width: "100%", maxWidth: 320, fontSize: 12, padding: "6px 8px", borderRadius: 8, border: `1px solid ${T.border}`, background: NAVY, color: "#C9D8F0" }} />}
    </div>
  );
}

/* Toolbar: optional search, provider pills, sort, copy-link. */
export function CompareToolbar({ page, state, set, seed, sorts, searchPlaceholder, providers, providerLabel = "Provider", children }) {
  const [q, setQ] = useState(state.q || "");
  const dq = useDebounced(q, 160);
  useEffect(() => { if ((state.q || "") !== dq) set("q", dq); }, [dq]); // eslint-disable-line react-hooks/exhaustive-deps
  const chosen = listParam(state.prov);
  const toggle = id => {
    const next = chosen.includes(id) ? chosen.filter(x => x !== id) : [...chosen, id];
    set("prov", next.join(","));
  };
  return (
    <div style={{ marginBottom: 14 }}>
      {children}
      {providers && providers.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: T.faint, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 7 }}>{providerLabel}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="fd-chip" onClick={() => set("prov", "")} aria-pressed={chosen.length === 0} style={{ ...chip(chosen.length === 0), flex: "0 1 auto", minWidth: 0, padding: "7px 12px", fontSize: 12 }}>All</button>
            {providers.map(p => (
              <button key={p.id} className="fd-chip" onClick={() => toggle(p.id)} aria-pressed={chosen.includes(p.id)} style={{ ...chip(chosen.includes(p.id)), flex: "0 1 auto", minWidth: 0, padding: "7px 12px", fontSize: 12 }}>
                {p.label}{p.count > 1 ? <span style={{ opacity: .6 }}> · {p.count}</span> : null}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
        {searchPlaceholder && (
          <input className="fd-input" value={q} onChange={e => setQ(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder}
            style={{ flex: "1 1 200px", minWidth: 0, padding: "10px 13px", fontSize: 13.5, fontWeight: 500, color: "#fff", border: "1.5px solid rgba(148,180,255,0.18)", borderRadius: 11, outline: "none", background: "rgba(8,18,36,0.65)", fontFamily: "inherit" }} />
        )}
        <SortPopover value={state.sort} options={sorts} onChange={v => set("sort", v)} />
        <CopyLink page={page} seed={seed} sort={state.sort} />
      </div>
    </div>
  );
}

/* Sort rows: "shuffle" uses the visit seed; others use the column getter.
   Rows with no value (e.g. "Contact bank") always sink to the bottom. */
export function sortRows(rows, sortId, sorts, seed) {
  if (sortId === "shuffle") return seededShuffle(rows, seed);
  const s = sorts.find(x => x.id === sortId);
  if (!s || !s.get) return rows;
  return [...rows].sort((a, b) => {
    const va = s.get(a), vb = s.get(b);
    const na = va == null || va === "", nb = vb == null || vb === "";
    if (na && nb) return 0; if (na) return 1; if (nb) return -1;
    if (typeof va === "string") return s.dir === "desc" ? vb.localeCompare(va) : va.localeCompare(vb);
    return s.dir === "desc" ? vb - va : va - vb;
  });
}

/* ---------- the table ---------- */
export function CompareTable({ page, columns, rows, rowKey, asOf, sourceNote, empty, selection, maxHeight = "min(70vh, calc(100dvh - 210px))" }) {
  const nav = useNav();
  const [tip, setTip] = useState(null);
  const stats = useMemo(() => {
    const out = {};
    columns.forEach(c => {
      if (!c.num) return;
      const vals = rows.map(c.num).filter(v => v != null && isFinite(v));
      const maxAbs = Math.max(0, ...vals.map(Math.abs));
      let best = null;
      if (c.best && vals.length > 1) best = c.best === "max" ? Math.max(...vals) : Math.min(...vals);
      /* Mark a value only when it's genuinely distinctive: at most two rows share
         it. (Eleven funds tie at 0% exit load — outlining eleven cells says nothing.) */
      const ties = best == null ? 0 : vals.filter(v => v === best).length;
      out[c.key] = { maxAbs, best, uniqueBest: best != null && ties <= 2 && ties < vals.length };
    });
    return out;
  }, [columns, rows]);
  const tipCol = columns.find(c => c.key === tip);
  const boxRef = useRef(null);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const check = () => setWide(el.scrollWidth > el.clientWidth + 2);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [rows.length, columns.length]);
  const hasBars = columns.some(c => c.bar);
  const pin = { position: "sticky", left: 0, zIndex: 1, background: NAVY, boxShadow: "6px 0 8px -6px rgba(0,0,0,0.65)" };
  const issueHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Data issue on FinDesh: /compare/" + page)}&body=${encodeURIComponent("Page: https://findeshai.com/compare/" + page + "\nWhat looks wrong:\n\nWhere you saw the correct figure (link if possible):\n")}`;

  return (
    <div>
      {tipCol && (
        <div role="note" className="fd-up" style={{ display: "flex", gap: 10, alignItems: "flex-start", background: T.accentSoft, border: `1px solid ${T.accentBorder}`, borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
          <p style={{ margin: 0, flex: 1, fontSize: 12.5, lineHeight: 1.6, color: "#C9D8F0" }}><b style={{ color: "#fff" }}>{tipCol.tipTitle || tipCol.label}:</b> {tipCol.tip}</p>
          <button onClick={() => setTip(null)} aria-label="Close explanation" style={{ background: "none", border: "none", color: T.muted, fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
        </div>
      )}
      {wide && <p style={{ margin: "0 2px 6px", fontSize: 11, color: T.accent, fontWeight: 600 }}>Swipe the table sideways for more columns →</p>}
      <div ref={boxRef} style={{ overflow: "auto", maxHeight, background: "rgba(8,18,36,0.5)", border: `1px solid ${T.borderSoft}`, borderRadius: 14, overscrollBehavior: "auto" }}>
        <table className="fd-tbl" style={{ minWidth: columns.reduce((s, c) => s + (c.minW || 90), 0) }}>
          <thead>
            <tr>
              {columns.map((c, j) => (
                <th key={c.key} scope="col" style={{ position: "sticky", top: 0, zIndex: j === 0 ? 3 : 2, background: NAVY, padding: "10px 8px", verticalAlign: "bottom", ...(j === 0 ? { left: 0, paddingLeft: 12, boxShadow: "6px 0 8px -6px rgba(0,0,0,0.65)" } : null) }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    {c.label}
                    {c.tip && (
                      <button onClick={() => setTip(tip === c.key ? null : c.key)} aria-label={`What is ${c.tipTitle || c.label}?`} aria-expanded={tip === c.key}
                        style={{ width: 17, height: 17, borderRadius: "50%", border: `1px solid ${tip === c.key ? "rgba(79,158,255,0.6)" : T.border}`, background: tip === c.key ? T.accentSoft : "rgba(255,255,255,0.04)", color: tip === c.key ? T.accent : T.faint, fontSize: 10, fontWeight: 800, cursor: "pointer", padding: 0, lineHeight: 1, flexShrink: 0, fontFamily: "inherit" }}>?</button>
                    )}
                  </span>
                  {c.headNote && <div style={{ fontSize: 9, fontWeight: 700, color: T.amber, letterSpacing: ".04em", marginTop: 2 }}>{c.headNote}</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={columns.length} style={{ color: T.faint, padding: "18px 12px", textAlign: "left" }}>{empty || "Nothing matches — try clearing a filter."}</td></tr>}
            {rows.map(r => {
              const id = rowKey(r);
              const picked = selection && selection.isOn(id);
              return (
                <tr key={id} style={picked ? { background: "rgba(79,158,255,0.07)" } : undefined}>
                  {columns.map((c, j) => {
                    const v = c.num ? c.num(r) : null;
                    const st = stats[c.key];
                    const isBest = st && st.uniqueBest && v != null && v === st.best;
                    const w = st && st.maxAbs > 0 && v != null ? Math.max(4, (Math.abs(v) / st.maxAbs) * 100) : 0;
                    const base = j === 0 ? { ...pin, paddingLeft: 12, textAlign: "left", minWidth: c.minW || 130, maxWidth: c.maxW || 190, whiteSpace: "normal" } : { minWidth: c.minW || 80 };
                    return (
                      <td key={c.key} style={{ ...base, ...(isBest ? { boxShadow: `inset 0 0 0 1px rgba(0,214,143,0.35)${j === 0 ? ", 6px 0 8px -6px rgba(0,0,0,0.65)" : ""}`, background: j === 0 ? NAVY : "rgba(0,214,143,0.06)" } : null), ...(c.cellStyle ? c.cellStyle(r) : null) }}>
                        {j === 0 && selection ? (
                          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            {/* compact add-to-comparison toggle: 26px round, keeps rows short on phones */}
                            <button onClick={() => selection.toggle(id)} aria-pressed={picked} disabled={!picked && selection.full}
                              aria-label={(picked ? "Remove from" : "Add to") + " side-by-side comparison"} title={picked ? "In comparison" : (selection.full ? "Comparison is full (3)" : "Add to comparison")}
                              style={{ width: 26, height: 26, flexShrink: 0, marginTop: -2, borderRadius: "50%", fontSize: 14, fontWeight: 800, lineHeight: 1, fontFamily: "inherit", padding: 0, cursor: !picked && selection.full ? "not-allowed" : "pointer", border: `1px solid ${picked ? "rgba(79,158,255,0.7)" : T.border}`, background: picked ? T.accent : "rgba(255,255,255,0.03)", color: picked ? "#04080F" : (selection.full ? T.faint : "#8AC2FF"), touchAction: "manipulation" }}>
                              {picked ? "✓" : "+"}
                            </button>
                            <div style={{ minWidth: 0 }}>{c.render(r)}</div>
                          </div>
                        ) : c.render(r)}
                        {c.bar && v != null && (
                          <div aria-hidden="true" style={{ height: 4, borderRadius: 3, background: "rgba(148,180,255,0.10)", marginTop: 5 }}>
                            <div style={{ width: w + "%", height: "100%", borderRadius: 3, background: v < 0 ? T.red : T.accent, opacity: 0.75 }} />
                          </div>
                        )}
                        {isBest && <div style={{ fontSize: 9, fontWeight: 800, color: T.green, letterSpacing: ".04em", marginTop: 3, textTransform: "uppercase" }}>{c.best === "max" ? "Highest" : "Lowest"} here</div>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "6px 14px", marginTop: 8, fontSize: 11, color: T.faint, lineHeight: 1.55 }}>
        <span><b style={{ color: T.muted }}>Figures as of {asOf}.</b>{sourceNote ? <> {sourceNote}</> : null}</span>
        <span style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {ROUTES["/methodology"] && <a href="/methodology" onClick={e => { e.preventDefault(); nav("/methodology"); }} style={{ color: T.accent, textDecoration: "none", fontWeight: 600 }}>How we compile this →</a>}
          <a href={issueHref} onClick={() => taxTrack("data_issue_clicked", { page })} style={{ color: T.accent, textDecoration: "none", fontWeight: 600 }}>Report a data issue</a>
        </span>
      </div>
      {hasBars && <p style={{ margin: "4px 0 0", fontSize: 11, color: T.faint }}>Bars are relative to the biggest value in each column, not a 0–100% scale.{columns.some(c => c.best) ? " A green outline marks the highest or lowest figure in a column — a fact, not a recommendation." : ""}</p>}
    </div>
  );
}

/* Selection helper for the picker (max 3), mirrored into the URL as `sel`. */
export function useSelection(state, set, max = 3) {
  const ids = listParam(state.sel);
  return {
    ids,
    full: ids.length >= max,
    isOn: id => ids.includes(id),
    toggle: id => {
      const next = ids.includes(id) ? ids.filter(x => x !== id) : (ids.length < max ? [...ids, id] : ids);
      set("sel", next.join(","));
      taxTrack("compare_pick", { id, n: next.length });
    },
    clear: () => set("sel", ""),
  };
}

/* ---------- side-by-side picker ---------- */
export function SidePicker({ items, selection, nameOf, rowsSpec, noun = "item" }) {
  const chosen = selection.ids.map(id => items.find(i => i.__id === id)).filter(Boolean);
  const slots = [0, 1, 2].map(i => chosen[i] || null);
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.faint, letterSpacing: ".09em", textTransform: "uppercase", marginBottom: 8 }}>Side by side · pick 2–3 {noun}s</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
        {slots.map((it, i) => (
          <div key={i} style={{ minHeight: 54, borderRadius: 12, border: `1px dashed ${it ? T.accentBorder : T.border}`, background: it ? T.accentSoft : "rgba(255,255,255,0.02)", padding: "8px 10px", display: "flex", alignItems: "center", gap: 6 }}>
            {it ? (
              <>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{nameOf(it)}</span>
                <button onClick={() => selection.toggle(it.__id)} aria-label={"Remove " + nameOf(it)} style={{ background: "none", border: "none", color: T.muted, fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
              </>
            ) : <span style={{ fontSize: 11.5, color: T.faint }}>Slot {i + 1}: tap <b style={{ color: "#8AC2FF" }}>+</b> beside a name</span>}
          </div>
        ))}
      </div>
      {chosen.length >= 2 ? (
        <div className="fd-up">
          <div style={{ overflowX: "auto", background: "rgba(8,18,36,0.5)", border: `1px solid ${T.borderSoft}`, borderRadius: 14 }}>
            <table className="fd-tbl" style={{ minWidth: 120 + chosen.length * 140 }}>
              <thead><tr><th style={{ position: "sticky", left: 0, background: NAVY, paddingLeft: 12 }}> </th>{chosen.map(c => <th key={c.__id} style={{ color: "#fff", whiteSpace: "normal" }}>{nameOf(c)}</th>)}</tr></thead>
              <tbody>
                {rowsSpec.map(rs => {
                  const vals = chosen.map(c => (rs.num ? rs.num(c) : null));
                  const real = vals.filter(v => v != null && isFinite(v));
                  const best = rs.best && real.length > 1 ? (rs.best === "max" ? Math.max(...real) : Math.min(...real)) : null;
                  const unique = best != null && real.filter(v => v === best).length < real.length;
                  return (
                    <tr key={rs.label}>
                      <td style={{ position: "sticky", left: 0, background: NAVY, paddingLeft: 12, textAlign: "left", color: T.muted, whiteSpace: "normal", minWidth: 110 }}>{rs.label}</td>
                      {chosen.map((c, i) => {
                        const isBest = unique && vals[i] === best;
                        return (
                          <td key={c.__id} style={{ whiteSpace: "normal", ...(isBest ? { background: "rgba(0,214,143,0.06)", boxShadow: "inset 0 0 0 1px rgba(0,214,143,0.35)" } : null) }}>
                            {rs.render(c)}
                            {isBest && <div style={{ fontSize: 9, fontWeight: 800, color: T.green, letterSpacing: ".04em", marginTop: 3, textTransform: "uppercase" }}>{rs.best === "max" ? "Highest" : "Lowest"} of these</div>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button className="fd-chip" onClick={selection.clear} style={{ ...chip(false), marginTop: 10, padding: "8px 14px", fontSize: 12.5, flex: "0 0 auto", minWidth: 0 }}>Clear selection</button>
        </div>
      ) : <p style={{ fontSize: 12.5, color: T.faint, margin: 0 }}>Pick at least two to see them side by side.</p>}
    </div>
  );
}
