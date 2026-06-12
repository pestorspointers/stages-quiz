import React, { useEffect, useState } from "react";
import { Card, CardContent, Link, Typography, Container } from "@mui/material";
import { redirectToOffer } from "../lib/analytics";

const OFFER_URL = "https://www.pestorspointers.com/course-offerings-page";

function RedirectComponent() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown === 0) {
      // Fire the click-through conversion, then navigate (beacon flush).
      redirectToOffer(OFFER_URL);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Card sx={{ width: "100%" }}>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            Thank you for taking the time to fill out this survey.
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            If interested in learning more, please checkout{" "}
            <Link
              href="https://www.pestorspointers.com/course-offerings-page"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ fontWeight: "bold" }}
            >
              www.PestorsPointers.com
            </Link>
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Redirecting in {countdown} second{countdown !== 1 ? "s" : ""}...
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}

export default RedirectComponent;
