// src/lib/analytics.js
//
// Thin wrapper around the Meta Pixel. The rest of the app calls
// `track()` / `redirectToOffer()` and doesn't touch fbq directly.
//
// The Pixel ID is read from a CRA env var (must be REACT_APP_*-prefixed and
// live in a root `.env`). It is NOT a secret — it ships in the client bundle
// by design. If the ID is missing the module no-ops with a console warning;
// nothing throws.

const FB_PIXEL_ID =
  process.env.REACT_APP_META_PIXEL_ID || process.env.REACT_APP_FB_PIXEL_ID;

let initialized = false;

// Maps our internal event names -> Meta standard/custom events.
// Standard events (Lead, InitiateCheckout) show up as conversions in Ads Manager.
const META_EVENT_MAP = {
  quiz_start: { type: "trackCustom", name: "QuizStart" },
  quiz_question: { type: "trackCustom", name: "QuizQuestion" },
  quiz_complete: { type: "track", name: "Lead" },
  result_view: { type: "trackCustom", name: "ResultView" },
  video_play: { type: "trackCustom", name: "VideoPlay" },
  video_progress: { type: "trackCustom", name: "VideoProgress" },
  video_complete: { type: "trackCustom", name: "VideoComplete" },
  click_to_kajabi: { type: "track", name: "InitiateCheckout" },
};

function loadMetaPixel() {
  if (!FB_PIXEL_ID) {
    console.warn("[analytics] Meta Pixel ID missing — skipping");
    return;
  }
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js",
  );
  /* eslint-enable */
  window.fbq("init", FB_PIXEL_ID);
  window.fbq("track", "PageView");
}

export function initAnalytics() {
  if (initialized) return;
  initialized = true;
  loadMetaPixel();
}

/**
 * Fire one funnel event to the Meta Pixel.
 * @param {string} eventName  e.g. 'quiz_complete'
 * @param {object} params     e.g. { question_number: 3 } or { result: 'A' }
 */
export function track(eventName, params = {}) {
  if (!window.fbq) return;
  const meta = META_EVENT_MAP[eventName];
  if (meta) window.fbq(meta.type, meta.name, params);
  else window.fbq("trackCustom", eventName, params);
}

/**
 * Fire the click-through conversion, then navigate — giving the Pixel request
 * a brief moment to flush first. If the app set `window.location.href`
 * immediately, the browser would often kill the in-flight request during
 * navigation and the most important conversion would under-report.
 *
 * @param {string} url  destination to navigate to (the offer/checkout page)
 */
export function redirectToOffer(url) {
  if (!url) return;

  // Meta standard conversion
  if (window.fbq) window.fbq("track", "InitiateCheckout");

  // Let the beacon flush, then navigate. (fbq has no completion callback, so a
  // short delay is the standard way to avoid losing the event to navigation.)
  setTimeout(() => {
    window.location.href = url;
  }, 300);
}
