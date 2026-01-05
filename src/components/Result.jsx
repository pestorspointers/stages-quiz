// src/components/Result.jsx
import { Typography, Paper, List, ListItem } from "@mui/material";
import quizData from "../data/quizData";

export default function Result({ answers, userValue }) {
  if (userValue >= 1 && userValue <= 6) {
    return (
      <div>
        <p>Display VSL{userValue}</p>
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
