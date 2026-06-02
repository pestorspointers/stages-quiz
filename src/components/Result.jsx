import { useState, useEffect } from "react";
import { getUrl } from "aws-amplify/storage";
import VideoPlayer from "./VideoPlayer";
import { Typography, Box, CircularProgress } from "@mui/material";
import vslData from "../data/vslData";

export default function Result({ userValue }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const vsl = vslData[userValue];

  useEffect(() => {
    if (!vsl) return;

    setLoading(true);
    setError(null);

    getUrl({ path: vsl.videoPath })
      .then(({ url }) => {
        setVideoUrl(url.toString());
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load video URL", err);
        setError("Unable to load the video. Please try again.");
        setLoading(false);
      });
  }, [vsl]);

  if (!vsl) return null;

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
      <Typography variant="body1" gutterBottom>
        Thank you for taking the quiz.
      </Typography>

      <Typography variant="body1" gutterBottom>
        One important thing to understand is that throughout life, many of us
        experience multiple stages at once.
      </Typography>

      <Typography variant="body1" gutterBottom>
        However, based on your answers, it appears you are currently most
        influenced by {vsl.stageLabel}
      </Typography>

      <Typography variant="body1" gutterBottom sx={{ mt: 1 }}>
        At this stage, you may often feel:
      </Typography>

      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        {vsl.bullets.map((bullet) => (
          <Typography component="li" variant="body1" key={bullet}>
            {bullet}
          </Typography>
        ))}
      </Box>

      <Typography variant="body1" gutterBottom>
        The good news is that awareness creates clarity, and clarity creates
        movement.
      </Typography>

      <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
        Please watch this short video below to better understand this stage of
        life and how we can help you find greater hope, clarity, direction, and
        purpose moving forward.
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" align="center">
          {error}
        </Typography>
      )}

      {!loading && !error && videoUrl && (
        <VideoPlayer selectedVideo={videoUrl} />
      )}
    </Box>
  );
}
