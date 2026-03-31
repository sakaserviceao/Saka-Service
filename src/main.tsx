import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error catcher for better production debugging
window.onerror = (message, source, lineno, colno, error) => {
  console.error('CRITICAL STARTUP ERROR:', { message, source, lineno, colno, error });
  return false;
};

createRoot(document.getElementById("root")!).render(<App />);
