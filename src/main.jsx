import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Survey from "./Survey.jsx";

// One app, two entry pages. No router library needed: a link to "/survey"
// does a normal page load, and this picks the right top-level component.
const path = window.location.pathname.replace(/\/+$/, "");
const Page = path === "/survey" ? Survey : App;

createRoot(document.getElementById("root")).render(<Page />);
