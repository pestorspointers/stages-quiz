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
    const allAnswers = [
      answers[1],
      answers[2],
      answers[3],
      answers[4],
      answers[5],
    ];

    for (let i = 0; i < allAnswers.length; i++) {
      const questionAnswers = allAnswers[i] || [];
      if (questionAnswers.length === 0) {
        setUserValue(null);
        return;
      }

      const lastOption = quizData[i + 1].options[6];
      const hasOptionFromFirstSix = questionAnswers.some(
        (answer) => answer !== lastOption
      );

      if (hasOptionFromFirstSix) {
        setUserValue(i + 2);
        return;
      }
    }

    setUserValue(7);
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

  const allAnswered = Object.keys(answers).length === total;

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
            disabled={!answers[current]}
          >
            Next
          </Button>
        )}
      </Box>
    </Container>
  );
}
