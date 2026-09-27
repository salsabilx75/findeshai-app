// netlify/functions/fb-capi.js
//
// Server-side mirror of the Meta Pixel PageView event, sent via the Conversions
// API (CAPI). The browser pixel (index.html + applySEO() in src/App.jsx) already
// fires PageView client-side; this function sends the SAME event_id server-side
// so Meta deduplicates the two into one event, per Meta's CAPI dedup rules:
// https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events
//
// Why this exists: the browser pixel alone misses events lost to ad blockers,
// Safari/iOS ITP, and third-party cookie restrictions. CAPI sends the same event
// straight from Netlify's server to Meta, improving Event Match Quality (EMQ)
// and event volume without double-counting (dedup handles that).
//
// REQUIRED SETUP (not done by this code):
//   Set META_CAPI_ACCESS_TOKEN in Netlify's site environment variables.
//   Generate it in Events Manager → Data sources → FinDesh AI pixel →
//   Settings → Conversions API → "Generate access token".
//   Never commit this token or expose it client-side — it only lives in this
//   server-side function via process.env.

const PIXEL_ID = "1731114804575229";
// Verified 27 Sep 2026 by probing graph.facebook.com directly: v21.0–v26.0 all
// resolve, v27.0 does not exist yet. v21.0 (released Oct 2024) is REMOVED on
// 21 Jan 2027 — Meta doesn't hard-fail an expired version, it silently serves
// the next one up, so an expired pin shows as behaviour drift rather than an
// outage. v26.0 (Jul 2026) buys roughly two years. Re-check before Jan 2028.
const GRAPH_VERSION = "v26.0";
// Meta hangs are the realistic failure mode; without this the Netlify function
// stays open until the platform timeout kills it, burning execution time.
const META_TIMEOUT_MS = 4000;

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) {
    // Fail silently (200) — tracking must never surface as a client-side error.
    // Check Netlify function logs for this line if events aren't showing up
    // in Events Manager's "Server" column.
    console.error("fb-capi: META_CAPI_ACCESS_TOKEN is not set in Netlify env vars");
    return new Response(JSON.stringify({ skipped: true, reason: "no_token" }), { status: 200 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request: invalid JSON", { status: 400 });
  }

  const { event_name, event_id, event_source_url, fbp, fbc, custom_data } = body || {};
  if (!event_name || !event_id) {
    return new Response("Bad Request: event_name and event_id are required", { status: 400 });
  }

  // Read IP/UA from the request itself (not from the client payload) —
  // Meta's match-quality guidance is to use the server-observed values.
  // context.ip IS a real, documented Netlify Functions v2 field (Functions API
  // reference, "Context object → ip": "A string containing the client IP
  // address") — verified 27 Sep 2026, so this is the live path, not dead code.
  // x-nf-client-connection-ip no longer appears in Netlify's current docs; it's
  // kept purely as a legacy belt-and-braces fallback and normally does nothing.
  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || undefined;
  const ua = req.headers.get("user-agent") || undefined;

  const payload = {
    data: [
      {
        event_name,
        // Server time, not a client-supplied timestamp: device clocks are often
        // wrong and Meta rejects events outside a 7-day window. event_time is
        // NOT part of the dedup key (that's event_id + event_name), so the few
        // hundred ms of drift versus the browser event is irrelevant here.
        event_time: Math.floor(Date.now() / 1000),
        event_id, // must match the client fbq(...) eventID for dedup
        event_source_url,
        action_source: "website",
        user_data: {
          ...(ip ? { client_ip_address: ip } : {}),
          ...(ua ? { client_user_agent: ua } : {}),
          ...(fbp ? { fbp } : {}),
          ...(fbc ? { fbc } : {}),
        },
        ...(custom_data && typeof custom_data === "object" ? { custom_data } : {}),
      },
    ],
    // Set META_CAPI_TEST_EVENT_CODE in Netlify env vars to route events to
    // Events Manager → Test events. Leave it UNSET in production: test events
    // are excluded from ad optimisation. Env-var driven so testing never
    // requires editing (and later un-editing) this file.
    ...(process.env.META_CAPI_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_CAPI_TEST_EVENT_CODE }
      : {}),
  };

  // AbortController so a slow/hanging Meta API can't hold the function open.
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), META_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ac.signal,
      }
    );
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Grep Netlify function logs for "fb-capi:" to see these.
      console.error(`fb-capi: Meta rejected ${event_name} (${res.status})`, JSON.stringify(result));
    }
    return new Response(JSON.stringify({ ok: res.ok }), { status: 200 });
  } catch (err) {
    const aborted = err?.name === "AbortError";
    console.error(
      aborted
        ? `fb-capi: graph.facebook.com timed out after ${META_TIMEOUT_MS}ms for ${event_name}`
        : `fb-capi: request to graph.facebook.com failed for ${event_name}`,
      aborted ? "" : err
    );
    return new Response(JSON.stringify({ ok: false }), { status: 200 });
  } finally {
    clearTimeout(timer);
  }
};
