import { useRef } from "react";
import { Box } from "@mui/material";

export default function VideoPlayer({ selectedVideo, onEnded }) {
  const videoRef = useRef(null);

  const handlePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    const requestFS =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen;
    if (requestFS) requestFS.call(el);
  };

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <video
        ref={videoRef}
        src={selectedVideo}
        controls
        onPlay={handlePlay}
        onEnded={onEnded}
        style={{ display: "block", width: "100%", maxHeight: "60vh" }}
      />
    </Box>
  );
}
