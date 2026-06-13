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
    const onEnded = () => track("video_complete", { percent: 100, ...extraParams });

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
