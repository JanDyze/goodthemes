import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "goodthemes";
import { App } from "./app";
import "../../dist/styles.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider storageKey="goodthemes-playground" defaultTheme="exile" defaultMode="light" ambient>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
