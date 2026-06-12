import { Box } from "@mui/material";
import { useVideoTracking } from "../hooks/useVideoTracking";

export default function VideoPlayer({ selectedVideo, onEnded, result }) {
  // Tracks play / 25-50-75 / complete, tagged with the result so engagement
  // is segmentable by stage. Attach the ref to the <video> element.
  const videoRef = useVideoTracking({ result });

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <video
        ref={videoRef}
        src={selectedVideo}
        controls
        autoPlay
        muted
        onEnded={onEnded}
        style={{ display: "block", width: "100%", maxHeight: "60vh" }}
      />
    </Box>
  );
}
