// src/components/Quiz.jsx
import { useState, useEffect } from "react";
import quizData from "../data/quizData";
import Question from "./Question";
import Result from "./Result";
import RedirectComponent from "./RedirectComponent";
import {
  Button,
  Container,
  Typography,
  Box,
  LinearProgress,
} from "@mui/material";

export default function Quiz() {
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [userValue, setUserValue] = useState(null);
  const total = quizData.length;

  useEffect(() => {
    // Slide 1 (Q1, answers[0]) — does nothing, excluded entirely

    // Slide 2 (Q2, answers[1]) — either/or gate
    // Any answer 1-6 locks userValue to stage 1 (VSL 2); only answer 7 passes through
    const slide2Answers = answers[1] || [];
    const slide2None = quizData[1].options[6];
    const slide2HasNonSeven = slide2Answers.some((a) => a !== slide2None);
    if (slide2HasNonSeven) {
      setUserValue(2); // Stage 1 → VSL 2
      return;
    }

    // Slides 3–6 (Q3-Q6, answers[2]-answers[5])
    // Tally option positions 1-6 only (7 = "None", ignored unless all are 7)
    const tailAnswers = [answers[2], answers[3], answers[4], answers[5]];

    if (!tailAnswers.some((a) => a && a.length > 0)) {
      setUserValue(null);
      return;
    }

    const counts = {};
    for (let i = 0; i < tailAnswers.length; i++) {
      const questionAnswers = tailAnswers[i] || [];
      const options = quizData[i + 2].options;
      for (const answer of questionAnswers) {
        const idx = options.indexOf(answer);
        if (idx !== -1 && idx < 6) { // skip position 7 (None)
          const val = idx + 1;
          counts[val] = (counts[val] || 0) + 1;
        }
      }
    }

    // All "None" answers → redirect
    if (Object.keys(counts).length === 0) {
      setUserValue(7);
      return;
    }

    // Most-selected value wins; ties go to the lower number
    let winner = null;
    let best = 0;
    for (const [val, count] of Object.entries(counts)) {
      const n = Number(val);
      if (count > best || (count === best && n < winner)) {
        winner = n;
        best = count;
      }
    }

    // Stage → VSL key mapping:
    // Stage 1→VSL2, Stage 2→VSL3, Stage 3→VSL4, Stage 4→VSL5, Stage 5+6→VSL6
    setUserValue(Math.min(winner + 1, 6));
  }, [answers]);

  const handleAnswerChange = (newSelected) => {
    setAnswers({ ...answers, [current]: newSelected });
  };

  const handleNext = () => {
    if (current < total - 1) setCurrent(current + 1);
  };

  const handlePrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const allAnswered = quizData.every((_, i) => answers[i]?.length > 0);

  const getDisabledOptions = () => {
    const currentAnswers = answers[current] || [];
    const lastOption = quizData[current].options[6];

    if (currentAnswers.includes(lastOption)) {
      return quizData[current].options.slice(0, 6);
    }

    if (currentAnswers.length > 0) {
      return [lastOption];
    }

    return [];
  };

  if (submitted) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        {/* <Typography variant="h4" align="center" gutterBottom>
          Self-Discovery Quiz
        </Typography> */}
        {userValue === 7 ? (
          <RedirectComponent />
        ) : (
          <Result answers={answers} userValue={userValue} />
        )}
      </Container>
    );
  }

  console.log(userValue);

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Self-Discovery Quiz
      </Typography>

      <LinearProgress
        variant="determinate"
        value={((current + 1) / total) * 100}
        sx={{ mb: 4 }}
      />

      <Question
        data={quizData[current]}
        selected={answers[current] || []}
        onChange={handleAnswerChange}
        disabledOptions={getDisabledOptions()}
      />

      <Box display="flex" justifyContent="space-between" mt={2}>
        <Button
          variant="outlined"
          onClick={handlePrev}
          disabled={current === 0}
        >
          Back
        </Button>

        {current === total - 1 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={!allAnswered}
          >
            Submit
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!(answers[current]?.length > 0)}
          >
            Next
          </Button>
        )}
      </Box>
    </Container>
  );
}
