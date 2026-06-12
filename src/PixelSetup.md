# Funnel Tracking Implementation Spec

> **For the implementing agent (Claude in VS Code):** This is a work order, not a finished patch. The exact component/file names below are _guesses_ based on a standard CRA quiz SPA. **Before writing code, read the repo** and map each "fire this event here" instruction to the real components, state, and router (if any). Where this spec gives full code (the analytics module, the video hook, the redirect helper), use it verbatim. Where it says "find the place where X happens," locate the real code and instrument it.

---

## 1. Context

This is a Facebook-ad-driven funnel built as a **client-side React SPA** (`create-react-app`), hosted on **AWS Amplify**.

The funnel:

1. User watches a Facebook ad video → clicks through to this app.
2. App presents a **6-question quiz**.
3. After Q6, the app shows a **result video** chosen by the user's answers.
4. User is redirected to an external **Kajabi** course/VSL page to purchase.

### The problem this solves

AWS Amplify only reports **server-side hosting metrics** (requests, bandwidth, status codes). Because this is a SPA, the entire quiz → result → redirect sequence runs in the browser with no further server round-trips, so Amplify cannot distinguish a completed quiz from a Q1 bounce. **The funnel must be instrumented with client-side events.**

### Goal — answer these questions with real numbers

- How many people **started** the quiz?
- How many **finished** all 6 questions?
- **Which result** did they get? (distribution by result)
- Did they **watch the result video** (and how far)?
- How many **clicked through to Kajabi**?
- (Stretch) Exactly **which question** people drop off on.

---

## 2. Approach

Fire custom client-side events at each funnel step to two destinations:

- **Meta Pixel** — required. Not only for measurement: Meta needs these conversion events to optimize ad delivery and to build retargeting audiences. Map key steps to Meta **standard events** so they appear as conversions in Ads Manager.
- **Google Analytics 4 (GA4)** — for the funnel/drop-off reporting (GA4 → Explore → Funnel exploration).

Both are wrapped behind a single `track()` helper so the rest of the app calls one function and doesn't care about the vendors.

> **Note on IDs:** A Meta Pixel ID and a GA4 Measurement ID are **not secrets** — they are exposed in the client bundle by design. Using env vars is for config cleanliness, not security.

---

## 3. Prerequisites (the human must provide these)

Create a `.env` file (and set the same vars in **Amplify → App settings → Environment variables**). CRA requires the `REACT_APP_` prefix and **rebuilds are needed** for changes to take effect.

```env
REACT_APP_FB_PIXEL_ID=XXXXXXXXXXXXXXX
REACT_APP_GA4_ID=G-XXXXXXXXXX
REACT_APP_KAJABI_URL=https://your-course.kajabi.com/offers/...
```

If any value is missing at runtime, the analytics module should **no-op gracefully** (log a console warning, never throw).

---

## 4. Files to create

### 4.1 `src/lib/analytics.js`

A self-contained module that programmatically loads both vendors and exposes `initAnalytics()` and `track()`. Loading programmatically (vs. snippets in `public/index.html`) keeps everything in one place and avoids CRA HTML-interpolation gotchas.

```js
// src/lib/analytics.js
const FB_PIXEL_ID = process.env.REACT_APP_FB_PIXEL_ID;
const GA4_ID = process.env.REACT_APP_GA4_ID;

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

function loadGA4() {
  if (!GA4_ID) {
    console.warn("[analytics] GA4 ID missing — skipping");
    return;
  }
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA4_ID);
}

export function initAnalytics() {
  if (initialized) return;
  initialized = true;
  loadMetaPixel();
  loadGA4();
}

/**
 * Fire one funnel event to both Meta and GA4.
 * @param {string} eventName  e.g. 'quiz_complete'
 * @param {object} params     e.g. { question_number: 3 } or { result: 'A' }
 */
export function track(eventName, params = {}) {
  // Meta
  if (window.fbq) {
    const meta = META_EVENT_MAP[eventName];
    if (meta) window.fbq(meta.type, meta.name, params);
    else window.fbq("trackCustom", eventName, params);
  }
  // GA4
  if (window.gtag) {
    window.gtag("event", eventName, params);
  }
}
```

### 4.2 `src/hooks/useVideoTracking.js` (optional helper)

Encapsulates the play / 25-50-75 / complete milestone logic for a raw HTML5 `<video>`. Attach the returned ref to the video element.

```js
// src/hooks/useVideoTracking.js
import { useEffect, useRef } from "react";
import { track } from "../lib/analytics";

export function useVideoTracking(extraParams = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const milestones = new Set();
    let playFired = false;

    const onPlay = () => {
      if (!playFired) {
        playFired = true;
        track("video_play", extraParams);
      }
    };
    const onTimeUpdate = () => {
      if (!video.duration) return;
      const pct = (video.currentTime / video.duration) * 100;
      [25, 50, 75].forEach((m) => {
        if (pct >= m && !milestones.has(m)) {
          milestones.add(m);
          track("video_progress", { percent: m, ...extraParams });
        }
      });
    };
    const onEnded = () => track("video_complete", extraParams);

    video.addEventListener("play", onPlay);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}
```

> **If the result video is a YouTube or Vimeo embed instead of a raw `<video>`:** the milestone idea is identical but the wiring differs — use the **YouTube IFrame Player API** (`onStateChange` + polling `getCurrentTime`/`getDuration`) or the **Vimeo Player SDK** (`player.on('timeupdate', ...)`). Detect which one the repo uses and adapt; do not assume `<video>`.

---

## 5. Where to fire each event

> Read the repo and place each call at the real location. The table is the contract; the file names are guesses.

| Funnel step                          | Call                                             | Likely location                                                                                                      |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| App boot                             | `initAnalytics()`                                | `src/index.js` or top-level `App` `useEffect`, once, before anything else                                            |
| **Quiz start**                       | `track('quiz_start')`                            | On render/mount of Q1, or the "Start" button handler. Guard so it fires **once**.                                    |
| **Question answered**                | `track('quiz_question', { question_number: n })` | The answer-select / "Next" handler for each question. Pass the 1-based index.                                        |
| **Quiz complete**                    | `track('quiz_complete')`                         | The handler that runs after Q6 is answered, where results get computed. Fire **once**.                               |
| **Result view**                      | `track('result_view', { result: resultId })`     | On mount of the result screen. Include the result identifier/name as a param.                                        |
| **Video play / progress / complete** | via `useVideoTracking()`                         | The result-video component. Pass `{ result: resultId }` as extraParams so video engagement is segmentable by result. |
| **Click to Kajabi**                  | `goToKajabi(url)` (see §6)                       | The redirect button/link/auto-redirect on the result or post-video screen.                                           |

**Idempotency matters.** `quiz_start`, `quiz_complete`, and `result_view` must not double-fire on re-render. Use a `useRef(false)` latch or fire inside a `useEffect` with a correct dependency array — not in the render body.

---

## 6. The redirect to Kajabi (critical — easy to under-count)

If the app fires the event and then immediately sets `window.location.href`, the browser frequently **kills the in-flight tracking request** during navigation, so the most important conversion under-reports. Use a redirect helper that lets the event flush first:

```js
// place near the redirect logic, or in src/lib/analytics.js
import { track } from "./lib/analytics";

export function goToKajabi() {
  const url = process.env.REACT_APP_KAJABI_URL;

  // Meta standard conversion
  if (window.fbq) window.fbq("track", "InitiateCheckout");

  // GA4 with beacon transport so it survives the navigation
  if (window.gtag) {
    window.gtag("event", "click_to_kajabi", {
      transport_type: "beacon",
      event_callback: () => {
        window.location.href = url;
      },
    });
  }

  // Fallback in case the callback doesn't fire (e.g., gtag blocked)
  setTimeout(() => {
    window.location.href = url;
  }, 300);
}
```

Wire the redirect button's `onClick` (or the auto-redirect timer) to `goToKajabi()` instead of a bare `window.location` assignment.

---

## 7. Manual steps (NOT code — flag these to the human in the PR description)

These cannot be done in this repo and must be noted as follow-ups:

1. **Put the same Meta Pixel + GA4 on the Kajabi side.** Once the user leaves for Kajabi, this app can't see the actual purchase. Adding the **same Pixel ID** and GA4 in Kajabi's settings closes the loop from "clicked through" → "purchased" and lets Meta optimize toward purchases. (Map the Kajabi purchase/checkout to Meta `Purchase`.)
2. **Verify the Amplify SPA rewrite rule.** On a CRA SPA, stray 404s usually mean the rewrite that sends non-asset paths to `/index.html` is missing — which can dead-end ad traffic _before_ the quiz loads and quietly cap the top of the funnel. Confirm Amplify has a `200` rewrite from `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>` → `/index.html`. This is separate from tracking but affects every number above.
3. **Set the env vars in Amplify** (§3) and trigger a rebuild.

---

## 8. How to verify it works (do this before declaring done)

- **Meta Pixel Helper** (Chrome extension): load the app, walk the funnel, confirm `PageView`, `QuizStart`, `Lead`, `InitiateCheckout`, etc. fire in order.
- **Meta Events Manager → Test Events**: confirm events arrive server-side.
- **GA4 → Admin → DebugView** (or the `gtag` debug): confirm `quiz_start`, `quiz_question`, `quiz_complete`, `result_view`, `video_*`, `click_to_kajabi` arrive with correct params.
- Confirm `quiz_start` / `quiz_complete` / `result_view` each fire **exactly once** per run (no re-render duplicates).
- Confirm the Kajabi redirect still works **and** the click event lands (the beacon test).

---

## 9. Definition of done

- [ ] `src/lib/analytics.js` created; `initAnalytics()` called once at app boot; no-ops cleanly if IDs absent.
- [ ] `quiz_start` fires once when the quiz begins.
- [ ] `quiz_question` fires per question with `question_number`.
- [ ] `quiz_complete` fires once after Q6 (→ Meta `Lead`).
- [ ] `result_view` fires once with the `result` identifier.
- [ ] Video play / 25 / 50 / 75 / complete events fire, tagged with `result`.
- [ ] `click_to_kajabi` fires reliably on redirect (→ Meta `InitiateCheckout`) without breaking the navigation.
- [ ] No event double-fires on re-render.
- [ ] `.env.example` committed documenting the three env vars.
- [ ] PR description lists the §7 manual follow-ups.

---

## 10. Open questions for the agent to resolve from the code

1. Is the quiz **one stateful page** or **route-per-question** (react-router)? Affects where `quiz_start` / `result_view` are anchored.
2. Is the result video a raw **`<video>`**, a **YouTube embed**, or **Vimeo**? Determines the video-tracking wiring (§4.2).
3. Is the Kajabi redirect a **button click** or an **automatic timed redirect**? Either way it must route through `goToKajabi()`.
4. Is there a single result identifier already in state to pass as the `result` param? If results are computed inline, surface a stable id/name to tag the events.
