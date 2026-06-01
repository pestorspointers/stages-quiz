import React from "react";
import {
  Box,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Paper,
} from "@mui/material";

export default function Question({ data, selected, onChange, disabledOptions }) {
  const handleChange = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const colonIndex = data.prompt.indexOf(":");
  const category = colonIndex !== -1 ? data.prompt.slice(0, colonIndex) : null;
  const rest = colonIndex !== -1 ? data.prompt.slice(colonIndex + 1).trim() : data.prompt;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {category && (
          <Box
            component="span"
            sx={{
              display: "block",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "primary.main",
              mb: 0.5,
            }}
          >
            {category}
          </Box>
        )}
        {rest}
      </Typography>
      <FormControl component="fieldset" variant="standard">
        <FormGroup>
          {data.options.map((option) => (
            <FormControlLabel
              key={option}
              control={
                <Checkbox
                  checked={selected.includes(option)}
                  onChange={() => handleChange(option)}
                  disabled={disabledOptions.includes(option)}
                />
              }
              label={option}
            />
          ))}
        </FormGroup>
      </FormControl>
    </Paper>
  );
}
