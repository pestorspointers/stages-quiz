import { Box } from "@mui/material";

export default function VideoPlayer({ selectedVideo }) {
  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <video
        src={selectedVideo}
        controls
        style={{ display: "block", width: "100%", maxHeight: "60vh" }}
      />
    </Box>
  );
}
