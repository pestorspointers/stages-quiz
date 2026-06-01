# Implementation Plan — OWNER_UPDATE.md Changes

## Overview

Two separate areas of work:
1. **Result page** — show personalized text + correct VSL video (from S3) based on quiz routing
2. **Quiz questions** — add category labels and "(Click all that apply)" to each of the 6 question prompts

---

## Current Routing Logic (how userValue is determined)

The `Quiz.jsx` `useEffect` checks questions 2–6 (indices 1–5 in `answers`). The first question where the user picks any non-"none" option sets the `userValue`:

| userValue | Meaning | Maps to |
|-----------|---------|---------|
| 2 | Non-none answer first appears on Q2 | VSL 2 |
| 3 | Non-none answer first appears on Q3 | VSL 3 |
| 4 | Non-none answer first appears on Q4 | VSL 4 |
| 5 | Non-none answer first appears on Q5 | VSL 5 |
| 6 | Non-none answer first appears on Q6 | VSL 6 |
| 7 | All "none apply" across Q2–Q6 | RedirectComponent |

Q1 (Spirituality, index 0) is not part of the scoring — it's informational only.

---

## Part 1 — Result Page: Personalized Text + Correct VSL

### Step 1 — Confirm S3 video file names and extensions

Before coding, run an AWS CLI command (or check the S3 console) to list the exact keys in the bucket under `public-videos/`:

```
aws s3 ls s3://amplify-amplfybackend-ppa-videostoragebucketb22462-4fqdflzfhgfy/public-videos/ --region us-east-2
```

Expected keys will be something like `public-videos/VSL 2.mp4`, `public-videos/VSL 3.mp4`, etc. The exact filename and extension must be known before building the URL map.

### Step 2 — Decide on video URL strategy

The `amplify_outputs.json` grants `guest` (unauthenticated) `get` + `list` on `public-videos/*`. Two options:

**Option A — Amplify Storage `getUrl()`** (recommended)  
Use `@aws-amplify/storage` to generate a short-lived presigned URL at render time. This is the Amplify-native approach and respects access rules.

```js
import { getUrl } from 'aws-amplify/storage';
const { url } = await getUrl({ path: 'public-videos/VSL 2.mp4' });
```

**Option B — Direct S3 public URL**  
Only works if the bucket objects are set to public-read. Simpler but requires a bucket policy change.  
`https://amplify-amplfybackend-ppa-videostoragebucketb22462-4fqdflzfhgfy.s3.us-east-2.amazonaws.com/public-videos/VSL 2.mp4`

Verify which option works by checking the bucket's public access settings.

### Step 3 — Create a VSL config map in `src/data/vslData.js`

Create a new file that maps each `userValue` to:
- The S3 path (or full URL) of the VSL video
- The personalized heading text to show above the video

Contents per the OWNER_UPDATE.md:

| userValue | VSL file | Stage label |
|-----------|----------|-------------|
| 2 | VSL 2 | Stage #1 — "Drowning in the Ocean" |
| 3 | VSL 3 | Stage #2 — "Head Barely Above the Water" |
| 4 | VSL 4 | Stage #3 — "On Your Own Island" |
| 5 | VSL 5 | Stage #4 — "Leaving the Island in Your Boat" |
| 6 | VSL 6 | Stages #5 and #6 — "Reaching the Shoreline" and "Climbing the Mountain" |

Each entry also needs the full bullet-point body text from OWNER_UPDATE.md (copied verbatim).

### Step 4 — Update `src/components/Result.jsx`

Replace the current hardcoded golf video URL with dynamic logic:

1. Look up the `userValue` in the new `vslData.js` map
2. If using Option A (Amplify Storage), use a `useEffect` + `useState` to call `getUrl()` and store the resolved URL in state; show a loading indicator until ready
3. Render the personalized text block **above** the `<VideoPlayer>` component:
   - "Thank you for taking the quiz." intro paragraph
   - "One important thing to understand..." paragraph
   - "However, based on your answers..." paragraph identifying the stage
   - Bullet list of feelings ("At this stage, you may often feel:")
   - "The good news is..." closing paragraph
   - "Please watch this short video..." call to action
4. Then render `<VideoPlayer>` with the resolved S3 URL
5. Keep the existing `RedirectComponent` path for `userValue === 7` unchanged

### Step 5 — Update `src/components/VideoPlayer.jsx` (if needed)

Verify `ReactPlayer` can play S3 presigned URLs or direct S3 URLs. If using `react-player`, direct S3 MP4 URLs work natively. Presigned URLs also work. No component changes should be needed unless the `src` prop name needs to match (`url` vs `src` — check react-player docs; it uses `url`).

---

## Part 2 — Quiz Questions: Labels and "(Click all that apply)"

### Step 6 — Update `src/data/quizData.js`

Modify each question's `prompt` field:

| Question index | Current prompt | New prompt |
|----------------|---------------|------------|
| 0 | `"Where are you right now in your faith or spiritual journey?"` | `"SPIRITUALITY: Where are you right now in your faith or spiritual journey? (Click all that apply)"` |
| 1 | `"How have you been feeling lately — honestly?"` | `"EMOTIONALLY: How have you been feeling lately — honestly? (Click all that apply)"` |
| 2 | `"How clear do you feel about your life's purpose?"` | `"CLARITY & DIRECTION: How clear do you feel about your life's purpose? (Click all that apply)"` |
| 3 | `"How do you feel about your motivation and consistency?"` | `"ENDURANCE: How do you feel about your motivation and consistency? (Click all that apply)"` |
| 4 | `"What best describes your relationships and sense of connection?"` | `"RELATIONALLY: What best describes your relationships and sense of connection? (Click all that apply)"` |
| 5 | `"What best describes your sense of fulfillment or meaning in life?"` | `"RELEVANCE: What best describes your sense of fulfillment or meaning in life? (Click all that apply)"` |

Note: OWNER_UPDATE.md says "CALRITY & DIRECTION" but this appears to be a typo — use **"CLARITY & DIRECTION"**.

### Step 7 — Optional: Style the category label in `Question.jsx`

The category label (e.g., "SPIRITUALITY") could be bolded or styled differently from the rest of the prompt. If desired, split the `prompt` string on `":"` in `Question.jsx` and render the first part in bold. This is cosmetic and optional — confirm with owner before doing.

---

## File Change Summary

| File | Change |
|------|--------|
| `src/data/quizData.js` | Add category label + "(Click all that apply)" to all 6 prompts |
| `src/data/vslData.js` | **New file** — map of userValue → { videoPath, stageLabel, bullets } |
| `src/components/Result.jsx` | Replace hardcoded URL with dynamic VSL lookup; add personalized text block above video |
| `src/components/VideoPlayer.jsx` | Likely no changes; verify `url` prop name |
| `src/components/Question.jsx` | Optional: style the category label portion of the prompt |

---

## Pre-Coding Blockers (confirm before writing code)

1. **Exact S3 file names** — Run the `aws s3 ls` command in Step 1 to confirm VSL 2 through VSL 6 filenames and extensions.
2. **Public vs. presigned URL** — Determine whether the S3 objects are publicly readable or require Amplify Storage `getUrl()`.
3. **Category label styling** — Confirm whether "SPIRITUALITY", "EMOTIONALLY", etc. should be visually distinct (bold/different color) or plain text inline with the question.
