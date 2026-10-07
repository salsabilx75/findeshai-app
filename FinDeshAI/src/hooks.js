import { useEffect, useState } from "react";

/* Debounce a fast-changing value (e.g. a calculator input) so derived maths and
   re-renders run once the user pauses typing, not on every keystroke. Keeps
   INP down on low-end Android phones, which is most FinDesh traffic. */
export function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* True when the media query matches; updates on resize/rotation. */
export function useMediaQuery(query) {
  const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false);
  const [m, setM] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener ? mq.addEventListener("change", on) : mq.addListener(on);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", on) : mq.removeListener(on));
  }, [query]);
  return m;
}

/* Parse a user-typed amount ("1,00,000" / "৳ 50000") into a positive number. */
export const toAmount = s => {
  const n = Number(String(s ?? "").replace(/[^0-9.]/g, ""));
  return isFinite(n) && n > 0 ? n : 0;
};

/* Signed taka formatter — fmtFull in App.jsx renders negatives as "৳-1,234". */
export const takaSigned = (n, withPlus = false) => {
  const v = Math.round(n);
  const s = "৳" + Math.abs(v).toLocaleString("en-IN");
  return v < 0 ? "−" + s : (withPlus && v > 0 ? "+" + s : s);
};

/* Navigate to "/path", "/path?query" or "/path#anchor" with the app's router. The router works
   on paths only, so the #anchor is restored afterwards with replaceState; the
   target page (lazy pages such as /learn and /compare/mutual-funds) reads it on
   mount and scrolls there. */
export function navTo(nav, path) {
  const [beforeHash, hash] = String(path).split("#");
  const [base, query] = beforeHash.split("?");
  nav(base);
  /* Restore ?query (e.g. a pre-selected comparison) and #anchor after routing. */
  if (query || hash) { try { history.replaceState(history.state, "", base + (query ? "?" + query : "") + (hash ? "#" + hash : "")); } catch (_) { /* no-op */ } }
}
