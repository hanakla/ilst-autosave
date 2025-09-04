import React from "react";
import ReactDOM from "react-dom/client";
import { initBolt } from "../lib/utils/bolt";
import { App } from "./main";

initBolt();

window.addEventListener("error", (e) => {
  alert(`Error: ${e.message}\nAt ${e.filename}:${e.lineno}:${e.colno}`);
});

// alert("Hi");

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
