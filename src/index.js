import React from "react";
import ReactDOM from "react-dom/client";
import { Amplify } from "aws-amplify";
import outputs from "./amplify_outputs.json";
import "./index.css";
import App from "./pages/App/App";
import { initAnalytics } from "./lib/analytics";

Amplify.configure(outputs);

// Boot analytics once, before anything renders.
initAnalytics();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
