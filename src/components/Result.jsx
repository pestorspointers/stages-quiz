// src/components/Result.jsx
import VideoPlayer from "./VideoPlayer";
import { Typography, Paper, List, ListItem } from "@mui/material";
import quizData from "../data/quizData";

export default function Result({ answers, userValue }) {
  const golfVid = "https://youtu.be/Y3HHlHSh-Tk?si=u3MKlZhHSWuyefDr";
  if (userValue >= 1 && userValue <= 6) {
    return (
      <div>
        <VideoPlayer selectedVideo={golfVid} />
      </div>
    );
  }

  const entries = Object.entries(answers);

  return (
    <Paper sx={{ p: 3, mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        Your Answers
      </Typography>
      {entries.map(([index, selected]) => (
        <div key={index}>
          <Typography variant="subtitle1" fontWeight="bold">
            {quizData[index].prompt}
          </Typography>
          <List dense>
            {selected.map((ans) => (
              <ListItem key={ans}>• {ans}</ListItem>
            ))}
          </List>
        </div>
      ))}
    </Paper>
  );
}
