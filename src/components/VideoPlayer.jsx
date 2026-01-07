import { Box } from "@mui/material";
import ReactPlayer from "react-player";
export default function VideoPlayer({ selectedVideo }) {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "80%",
        }}
      >
        <ReactPlayer
          src={selectedVideo}
          style={{ height: "50vh", width: "100%" }}
          controls
        />
      </Box>
    </>
  );
}
