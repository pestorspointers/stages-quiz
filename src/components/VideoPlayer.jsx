import { Box } from "@mui/material";

export default function VideoPlayer({ selectedVideo, onEnded }) {
  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <video
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
